/* eslint-disable */
import dotenv from "dotenv";
dotenv.config();

export const __prod__ = process.env.NODE_ENV == "production";
export const __accesstokensecret__ = process.env.ACCESS_TOKEN_SECRET;
export const __refreshtokensecret__ = process.env.REFRESH_TOKEN_SECRET;
export const COOKIE_NAME = "qid";
