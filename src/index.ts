import "reflect-metadata";
import { createConnection } from "typeorm";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import redis from "redis";
import connectRedis from "connect-redis";
import cors from "cors";
import bodyParser from "body-parser";

import { User } from "./entities/user";
import { __prod__, COOKIE_NAME } from "./constants";
import { Workout } from "./entities/workout";
import { WorkoutDifficulty } from "./entities/workoutDifficulty";
import { WorkoutDuration } from "./entities/workoutDuration";
import { WorkoutType } from "./entities/workoutType";

declare module "express-session" {
  export interface SessionData {
    userId: number;
  }
}

dotenv.config();

const main = async () => {
  const connection = await createConnection({
    type: "mysql",
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    synchronize: true,
    entities: [User, Workout, WorkoutDifficulty, WorkoutType, WorkoutDuration],
    migrations: ["./migrations/*.[tj]s"],
  });

  const app = express();

  require("dotenv").config();
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(
    cors({
      credentials: true,
      origin: "http://localhost:3000",
    })
  );

  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient({
    host: "localhost",
    port: 6379,
  });
  redisClient.on("error", function (err) {
    console.log("Could not establish a connection with redis. ", err);
  });
  redisClient.on("connect", function (err) {
    console.log("Connected to redis successfully");
  });
  app.use(
    session({
      name: COOKIE_NAME,
      saveUninitialized: false,
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        httpOnly: true,
        secure: __prod__,
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        sameSite: "lax",
      },
      resave: false,
      secret: "bfioaubdfuabsidubasbgualifgba",
    })
  );

  const apiRouter = require("./routes/api");
  app.use("/api", apiRouter);

  app.listen(8080, () => {
    console.log("Server started listening on localhost:8080");
  });
};

main().catch((err) => {
  console.error("ERROR", err);
});
