import { Connection } from "typeorm";
import schedule from "node-schedule";
import { User } from "../entities/user";
import { createAIWorkout } from "./ai";

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getChatGPTInput() {
  const d = new Date();
  const day = d.getDay();
  let level = "";
  let type = "Random";
  if (day === 1) {
    type = "Full body";
  } else if (day === 2) {
    type = "Upper body";
  } else if (day === 3) {
    type = "Legs";
  } else if (day === 4) {
    type = "Push";
  } else if (day === 5) {
    type = "Pull";
  } else if (day === 6) {
    type = "Core";
  }

  const randomLevel = getRandomInt(3);
  if (randomLevel === 0) {
    level = "Beginner";
  } else if (randomLevel === 1) {
    level = "Intermediate";
  } else if (randomLevel === 2) {
    level = "Advanced";
  }
  const prompt = `Create a ${level} ${type} workout`;
  return prompt;
}

function startCronJobs(connection: Connection) {
  const userRepo = connection.getRepository(User);

  //daily
  schedule.scheduleJob("0 1 * * *", () => {
    userRepo
      .createQueryBuilder()
      .update(User)
      .set({ type: "expired" })
      .where("premiumExpireDate < CAST(CURRENT_TIMESTAMP AS DATE)")
      .execute();

    userRepo
      .createQueryBuilder()
      .update(User)
      .set({ dailyFinish: false })
      .execute();

    createAIWorkout(getChatGPTInput(), connection);
  });

  //monthly
  schedule.scheduleJob("0 0 1 * *", () => {
    userRepo
      .createQueryBuilder()
      .update(User)
      .set({ monthlyFinishes: 0 })
      .execute();
  });
}

export { startCronJobs };
