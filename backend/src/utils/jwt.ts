import jwt, { SignOptions } from "jsonwebtoken";
import config from "../config";

export interface JwtPayload {
  userId: string;
  email: string;
}

export const generateToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: config.auth.jwtExpiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, config.auth.jwtSecret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
};
