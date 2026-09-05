import { io } from "socket.io-client";
import { getToken } from "../utils/auth";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = () => {
  const token = getToken();

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
};