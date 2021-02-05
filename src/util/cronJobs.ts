import { Connection } from "typeorm";
import schedule from "node-schedule";
import { User } from "../entities/user";

function startCronJobs(connection: Connection) {
  const userRepo = connection.getRepository(User);

  schedule.scheduleJob("0 1 * * *", () => {
    userRepo
      .createQueryBuilder()
      .update(User)
      .set({ type: "expired" })
      .where("premiumExpireDate < CAST(CURRENT_TIMESTAMP AS DATE)")
      .execute();
  });
}

export { startCronJobs };
