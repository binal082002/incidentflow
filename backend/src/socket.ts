import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { verifyToken } from "./utils/jwt";
import { db } from "./db";
import config from "./config";

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
    },
  });

  // Authenticate Socket.IO connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = verifyToken(token);

      socket.data.user = {
        userId: payload.userId,
        email: payload.email,
      };

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("project:join", async (projectId: string) => {
      try {
        const result = await db.query(
          `
            SELECT id
            FROM projects
            WHERE id = $1
              AND owner_id = $2
            LIMIT 1
            `,
          [projectId, socket.data.user.userId]
        );

        if (result.rowCount === 0) {
          console.log(
            "Socket project join denied:",
            projectId,
            "user:",
            socket.data.user.email
          );

          return;
        }

        await socket.join(`project:${projectId}`);

        console.log(
          "Socket joined project room:",
          projectId,
          "user:",
          socket.data.user.email
        );
      } catch (error) {
        console.error("Failed to join project room:", error);
      }
    });

    console.log(
      "Socket client connected:",
      socket.id,
      "user:",
      socket.data.user.email
    );

    socket.on("disconnect", () => {
      console.log("Socket client disconnected:", socket.id);
    });
  });

  return io;
};

export const getSocket = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};
