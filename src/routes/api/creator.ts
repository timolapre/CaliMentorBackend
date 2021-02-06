import { getRepository } from "typeorm";

import { Workout } from "../../entities/workout";
import { WorkoutHistory } from "../../entities/workoutHistory";

const paymentRouter = require("express").Router();

const workoutRepo = getRepository(Workout);
const WorkoutHistoryRepo = getRepository(WorkoutHistory);

// Creator total data
async function totalData(
  req
): Promise<{
  workoutsCount: number;
  finishesCount: number;
}> {
  const workoutsCount = await workoutRepo.count({ user: req.session.userId });
  const finishes = await workoutRepo
    .createQueryBuilder("w")
    .select("SUM(w.finishes)", "sum")
    .where("w.user = :id", { id: req.session.userId })
    .getRawOne();

  const finishesCount = finishes.sum;

  return { workoutsCount, finishesCount };
}
paymentRouter.get("/data", async (req, res) => {
  res.send(await totalData(req));
});

// Creator total data
async function monthlyData(req): Promise<any> {
  const date = new Date(req.body.date);

  const workoutsCount = await workoutRepo
    .createQueryBuilder("w")
    .where("w.user = :id", { id: req.session.userId })
    .andWhere("MONTH(w.createdAt) = :month", { month: date.getMonth() + 1 })
    .andWhere("YEAR(w.createdAt) = :year", { year: date.getFullYear() })
    .getCount();

  const finishesHistory = await WorkoutHistoryRepo.createQueryBuilder("wh")
    .where("MONTH(wh.createdAt) = :month", { month: date.getMonth() + 1 })
    .andWhere("YEAR(wh.createdAt) = :year", { year: date.getFullYear() })
    .innerJoinAndSelect("wh.workout", "w")
    .andWhere("w.user = :id", { id: req.session.userId })
    .getMany();

  const totalFinishes = await WorkoutHistoryRepo.createQueryBuilder("wh")
    .where("MONTH(wh.createdAt) = :month", { month: date.getMonth() + 1 })
    .andWhere("YEAR(wh.createdAt) = :year", { year: date.getFullYear() })
    .getCount();

  return { workoutsCount, finishesHistory, totalFinishes };
}
paymentRouter.post("/data", async (req, res) => {
  res.send(await monthlyData(req));
});

module.exports = paymentRouter;
