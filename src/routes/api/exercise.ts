import { getRepository } from "typeorm";

import { Exercise } from "../../entities/exercise";
import { ExerciseLevel } from "../../entities/exerciseLevel";

const exerciseRouter = require("express").Router();

const exerciseRepo = getRepository(Exercise);
const exerciseLevelRepo = getRepository(ExerciseLevel);

// Exercises
async function getExercises(req): Promise<Exercise[]> {
  const { type } = req.body;
  const qb = exerciseRepo
    .createQueryBuilder("e")
    .leftJoinAndSelect("e.levels", "levels")
    .orderBy("e.name", "ASC")
    .addOrderBy("levels.order", "ASC")
    .where("e.approved = :approved", { approved: true });

  if (type !== 0) {
    qb.where("e.type = :type", { type });
  }

  const exercises = qb.getMany();
  return exercises;
}
exerciseRouter.post("/", async (req, res) => {
  res.send(await getExercises(req));
});

// Exercises
async function getExercisesId(req): Promise<Exercise> {
  let { name } = req.body;

  const exerciseLevel = await exerciseLevelRepo.findOne(
    { name },
    { relations: ["exercise"] }
  );
  if (exerciseLevel) {
    name = exerciseLevel.exercise.name;
  }

  const exercises = exerciseRepo
    .createQueryBuilder("e")
    .leftJoinAndSelect("e.levels", "levels")
    .orderBy("e.name", "ASC")
    .addOrderBy("levels.order", "ASC")
    .where("e.approved = :approved AND e.name = :name", {
      approved: true,
      name,
    })
    .getOne();

  return exercises;
}
exerciseRouter.post("/id", async (req, res) => {
  res.send(await getExercisesId(req));
});

// Exercises
async function getAllExercises(): Promise<(Exercise | ExerciseLevel)[]> {
  const exercises = await exerciseRepo.find({ approved: true });
  const exercises2 = await exerciseLevelRepo.find({ approved: true });
  return [...exercises, ...exercises2];
}
exerciseRouter.get("/", async (req, res) => {
  res.send(await getAllExercises());
});

// Exercises
async function getExercisesCount(): Promise<string> {
  const count1 = await exerciseRepo.count({ where: { approved: true } });
  const count2 = await exerciseLevelRepo.count({ where: { approved: true } });
  return (count1 + count2).toString();
}
exerciseRouter.get("/count", async (req, res) => {
  res.send(await getExercisesCount());
});

module.exports = exerciseRouter;
