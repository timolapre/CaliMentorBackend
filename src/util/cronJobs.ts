import { Connection } from "typeorm";
import schedule from "node-schedule";
import { User } from "../entities/user";

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
