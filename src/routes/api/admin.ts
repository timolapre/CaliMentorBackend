import { getRepository } from "typeorm";

import { User } from "../../entities/user";
import { Exercise } from "../../entities/exercise";
import { Earning } from "../../entities/earning";
import { ExerciseLevel } from "../../entities/exerciseLevel";
import { WorkoutHistory } from "../../entities/workoutHistory";

const adminRouter = require("express").Router();

const userRepo = getRepository(User);
const exerciseRepo = getRepository(Exercise);
const exerciseLevelRepo = getRepository(ExerciseLevel);
const earningRepo = getRepository(Earning);
const workoutHistoryRepo = getRepository(WorkoutHistory);

// gift premium
async function giftPremium(req): Promise<{ succes: boolean; message: string }> {
  const user = await userRepo.findOne({ username: req.body.username });

  if (!user) {
    return { succes: false, message: "username not found" };
  }
  if (user.type === "gifted_premium" || user.type === "premium") {
    return { succes: false, message: "user already has premium" };
  }
  user.type = "gifted_premium";
  const date = new Date();
  date.setMonth(date.getMonth() + req.body.months);
  user.premiumExpireDate = date;
  await userRepo.save(user);
  return { succes: true, message: "Successfully gifted premium" };
}
adminRouter.post("/premiumgift", async (req, res) => {
  res.send(await giftPremium(req));
});

// Fake login
async function fakeLogin(req): Promise<string> {
  const user = await userRepo.findOne({ username: req.body.username });

  if (!user) {
    return "User not found";
  }
  req.session.userId = user.id;
  return "Success";
}
adminRouter.post("/fakelogin", async (req, res) => {
  res.send(await fakeLogin(req));
});

// All admin users info
async function infoUsers(req): Promise<any> {
  const premiumUsers = await userRepo.findAndCount({
    where: { type: "premium" },
    order: { createdAt: "DESC" },
  });
  const giftedPremiumUsers = await userRepo.findAndCount({
    where: { type: "gifted_premium" },
    order: { createdAt: "DESC" },
  });

  const freeUsers = await userRepo.findAndCount({
    where: { type: "free" },
    order: { createdAt: "DESC" },
  });
  const expiredUsers = await userRepo.findAndCount({
    where: { type: "expired" },
    order: { createdAt: "DESC" },
  });
  const canceledUsers = await userRepo.findAndCount({
    where: { type: "canceled" },
    order: { createdAt: "DESC" },
  });

  return {
    premiumUsers,
    giftedPremiumUsers,
    freeUsers,
    expiredUsers,
    canceledUsers,
  };
}
adminRouter.get("/users/info", async (req, res) => {
  res.send(await infoUsers(req));
});

// Add exercise
async function addExercise(req): Promise<{ succes: boolean; message: string }> {
  if (!req.body.name) {
    return {
      succes: false,
      message: "Can not create an exercise without a name",
    };
  }

  const exerciseCount = await exerciseRepo.findOne({ name: req.body.name });
  if (exerciseCount) {
    return { succes: false, message: "Exercise already exists" };
  }

  const exercise = new Exercise();
  exercise.name = req.body.name;
  exercise.approved = true;
  await exerciseRepo.save(exercise);
  return { succes: true, message: "Successfully added exercise" };
}
adminRouter.post("/exercises/add", async (req, res) => {
  res.send(await addExercise(req));
});

async function approveExercise(req): Promise<boolean> {
  const exercise = await exerciseRepo.findOne({ name: req.body.name });
  exercise.approved = true;
  await exerciseRepo.save(exercise);
  return true;
}
adminRouter.post("/exercises/approve", async (req, res) => {
  res.send(await approveExercise(req));
});

async function deleteExercise(req): Promise<boolean> {
  const exercise = await exerciseRepo.findOne({ name: req.body.name });
  if (exercise) {
    await exerciseRepo.remove(exercise);
  }
  return true;
}
adminRouter.post("/exercises/delete", async (req, res) => {
  res.send(await deleteExercise(req));
});

// All admin exercises info
async function infoExercises(): Promise<Exercise[]> {
  const exercises = exerciseRepo
    .createQueryBuilder("e")
    .leftJoinAndSelect("e.levels", "levels")
    .orderBy("e.name", "ASC")
    .addOrderBy("levels.order", "ASC")
    .getMany();

  return exercises;
}
adminRouter.get("/exercises/info", async (req, res) => {
  res.send(await infoExercises());
});

// Update exercise level order
async function update(req): Promise<boolean> {
  const { exercise } = req.body;
  exerciseRepo
    .createQueryBuilder()
    .update(Exercise)
    .set({ name: exercise.name })
    .set({ type: exercise.type })
    .where("id = :id", { id: exercise.id })
    .execute();

  exercise.levels.forEach((level) => {
    exerciseLevelRepo
      .createQueryBuilder()
      .update(ExerciseLevel)
      .set({ order: level.order, name: level.name })
      .where("id = :id", { id: level.id })
      .execute();
  });

  return true;
}
adminRouter.post("/exercises/update", async (req, res) => {
  res.send(await update(req));
});

//add Exercise Level
async function addExerciseLevel(req): Promise<ExerciseLevel> {
  const { id, exercise, order } = req.body;
  const exerciseLevel = new ExerciseLevel();
  exerciseLevel.exercise = id;
  exerciseLevel.name = exercise;
  exerciseLevel.order = order;
  const newExerciseLevel = await exerciseLevelRepo.save(exerciseLevel);

  return newExerciseLevel;
}
adminRouter.post("/exercises/level/add", async (req, res) => {
  res.send(await addExerciseLevel(req));
});

//delete Exercise Level
async function deleteExerciseLevel(req): Promise<boolean> {
  const { id } = req.body;
  const exerciseLevel = await exerciseLevelRepo.findOne(id);
  await exerciseLevelRepo.remove(exerciseLevel);

  return true;
}
adminRouter.post("/exercises/level/delete", async (req, res) => {
  res.send(await deleteExerciseLevel(req));
});

//delete Exercise
async function deleteExerciseId(req): Promise<boolean> {
  const { id } = req.body;
  const exercise = await exerciseRepo.findOne(id);
  await exerciseRepo.remove(exercise);

  return true;
}
adminRouter.post("/exercises/delete/id", async (req, res) => {
  res.send(await deleteExerciseId(req));
});

// Earnings
async function getEarnings(): Promise<Earning[]> {
  const earnings = await earningRepo.find({ order: { month: "DESC" } });
  return earnings;
}
adminRouter.get("/earnings", async (req, res) => {
  res.send(await getEarnings());
});

// Last workout finishes
async function getLatestWorkoutFinishes(): Promise<WorkoutHistory[]> {
  const history = await workoutHistoryRepo
    .createQueryBuilder("wh")
    .leftJoinAndSelect("wh.user", "user")
    .leftJoinAndSelect("wh.workout", "workout")
    .orderBy("wh.createdAt", "DESC")
    .limit(20)
    .getMany();

  return history;
}
adminRouter.get("/latestworkoutfinishes", async (req, res) => {
  res.send(await getLatestWorkoutFinishes());
});

module.exports = adminRouter;
