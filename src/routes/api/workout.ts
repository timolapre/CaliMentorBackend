import { getRepository } from "typeorm";
import { Workout } from "../../entities/workout";
import { WorkoutType } from "../../entities/workoutType";
import { WorkoutDifficulty } from "../../entities/workoutDifficulty";
import { WorkoutDuration } from "../../entities/workoutDuration";
import { isAuthenticated } from "../../util/authentication";

const workoutRouter = require("express").Router();

const workoutRepo = getRepository(Workout);
const workoutTypeRepo = getRepository(WorkoutType);
const workoutDifficultyRepo = getRepository(WorkoutDifficulty);
const workoutDurationRepo = getRepository(WorkoutDuration);

// all
async function getAll(): Promise<Workout[]> {
  const workouts = await workoutRepo.find({
    relations: ["user", "type", "difficulty", "duration"],
    order: { createdAt: "DESC" },
  });
  return workouts;
}
workoutRouter.get("/all", async (req, res) => {
  res.send(await getAll());
});

// all
async function getSearch(req): Promise<Workout[]> {
  const { body } = req;
  const { filters } = body;

  const qb = workoutRepo
    .createQueryBuilder("w")
    .innerJoinAndSelect("w.type", "type")
    .innerJoinAndSelect("w.difficulty", "difficulty")
    .innerJoinAndSelect("w.duration", "duration")
    .innerJoinAndSelect("w.user", "user");
  if (filters.type) {
    qb.andWhere("w.typeId = :type", { type: filters.type });
  }
  if (filters.difficulty) {
    qb.andWhere("w.difficultyId = :difficulty", {
      difficulty: filters.difficulty,
    });
  }
  if (filters.duration) {
    qb.andWhere("w.durationId = :duration", { duration: filters.duration });
  }
  if (filters.creator) {
    qb.andWhere("user.username LIKE :creator", {
      creator: `%${filters.creator}%`,
    });
  }
  const workouts = await qb
    .orderBy("w.createdAt", "DESC")
    .skip(body.skip)
    .take(body.take)
    .getMany();

  return workouts;
}
workoutRouter.post("/search", async (req, res) => {
  res.send(await getSearch(req));
});

// one
async function getOne(id): Promise<Workout> {
  const workout = await workoutRepo.findOne(id, {
    relations: ["user", "type", "difficulty", "duration"],
  });
  workout.blocks = workout.blocks ? JSON.parse(workout.blocks) : "";
  return workout;
}
workoutRouter.post("/id", async (req, res) => {
  res.send(await getOne(req.body.id));
});

// create
async function create(req): Promise<string> {
  const { body } = req;
  let workout = new Workout();
  workout = { ...body.workout };
  workout.blocks = JSON.stringify(body.workout.blocks);
  workout.user = req.session.userId;
  const success = await workoutRepo.save(workout);
  return success.id || null;
}
workoutRouter.post("/create", isAuthenticated, async (req, res) => {
  res.send(await create(req));
});

// edit
async function edit(req, res): Promise<Boolean> {
  const { body } = req;
  let workout = await workoutRepo.findOne(
    { id: body.id },
    {
      relations: ["user"],
    }
  );

  if (workout.user.id !== req.session.userId) {
    return res.sendStatus(401);
  }

  workout = { ...body.workout };
  workout.blocks = JSON.stringify(body.workout.blocks);
  workout.user = req.session.userId;
  await workoutRepo.save(workout);
  return true;
}
workoutRouter.post("/edit", isAuthenticated, async (req, res) => {
  res.send(await edit(req, res));
});

// delete
async function deleteWorkout(req, res): Promise<Boolean> {
  const { body } = req;
  const workout = await workoutRepo.findOne(
    { id: body.id },
    {
      relations: ["user"],
    }
  );

  if (workout.user.id !== req.session.userId) {
    return res.sendStatus(401);
  }

  await workoutRepo.delete({ id: body.id });
  return true;
}
workoutRouter.post("/delete", isAuthenticated, async (req, res) => {
  res.send(await deleteWorkout(req, res));
});

// types
async function getTypes(): Promise<WorkoutType[]> {
  const workoutTypes = await workoutTypeRepo.find();
  return workoutTypes;
}
workoutRouter.get("/types", async (req, res) => {
  res.send(await getTypes());
});

// Difficulty
async function getDifficulties(): Promise<WorkoutDifficulty[]> {
  const workoutDifficulties = await workoutDifficultyRepo.find();
  return workoutDifficulties;
}
workoutRouter.get("/difficulties", async (req, res) => {
  res.send(await getDifficulties());
});

// Durations
async function getDurations(): Promise<WorkoutDifficulty[]> {
  const workoutDurations = await workoutDurationRepo.find();
  return workoutDurations;
}
workoutRouter.get("/durations", async (req, res) => {
  res.send(await getDurations());
});

module.exports = workoutRouter;
