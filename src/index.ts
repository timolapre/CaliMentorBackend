import "reflect-metadata";
import { createConnection } from "typeorm";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectRedis from "connect-redis";
import cors from "cors";
import bodyParser from "body-parser";

import { User } from "./entities/user";
import { __prod__, COOKIE_NAME } from "./constants";
import { Workout } from "./entities/workout";
import { WorkoutDifficulty } from "./entities/workoutDifficulty";
import { WorkoutDuration } from "./entities/workoutDuration";
import { WorkoutType } from "./entities/workoutType";
import { redis } from "./redisClient";
import { Like } from "./entities/like";
import { Favorite } from "./entities/favorite";
import { Exercise } from "./entities/exercise";
import { PersonalRecord } from "./entities/personalRecord";
import { WorkoutHistory } from "./entities/workoutHistory";
import { Goal } from "./entities/goal";
import { startCronJobs } from "./util/cronJobs";
import { PersonalRecordHistory } from "./entities/personalRecordHistory";
import { Earning } from "./entities/earning";
import { ExerciseLevel } from "./entities/exerciseLevel";

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
    entities: [
      User,
      Workout,
      WorkoutDifficulty,
      WorkoutType,
      WorkoutDuration,
      Like,
      Favorite,
      Exercise,
      ExerciseLevel,
      PersonalRecord,
      PersonalRecordHistory,
      WorkoutHistory,
      Goal,
      Earning,
    ],
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
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
    })
  );

  const RedisStore = connectRedis(session);

  app.use(
    session({
      name: COOKIE_NAME,
      saveUninitialized: false,
      store: new RedisStore({
        client: redis,
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

  // Root route for health check
  app.get("/", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "CaliMentor Backend API is running",
      timestamp: new Date().toISOString() 
    });
  });

  const apiRouter = require("./routes/api");
  app.use("/api", apiRouter);

  startCronJobs(connection);

  const PORT = parseInt(process.env.PORT || "8080", 10);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started listening on 0.0.0.0:${PORT}`);
  });
};

main().catch((err) => {
  console.error("ERROR", err);
});
