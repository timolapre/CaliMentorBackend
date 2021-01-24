import { getRepository } from "typeorm";
import { Workout } from "../../entities/workout";
import { WorkoutType } from "../../entities/workoutType";
import { WorkoutDifficulty } from "../../entities/workoutDifficulty";
import { WorkoutDuration } from "../../entities/workoutDuration";
import { isAuthenticated, isPremium2 } from "../../util/authentication";
import { User } from "../../entities/user";
import { Like } from "../../entities/like";
import { Favorite } from "../../entities/favorite";
import { Exercise } from "../../entities/exercise";

const workoutRouter = require("express").Router();

const workoutRepo = getRepository(Workout);
const exerciseRepo = getRepository(Exercise);
const likeRepo = getRepository(Like);
const favoriteRepo = getRepository(Favorite);
const userRepo = getRepository(User);
const workoutTypeRepo = getRepository(WorkoutType);
const workoutDifficultyRepo = getRepository(WorkoutDifficulty);
const workoutDurationRepo = getRepository(WorkoutDuration);

// count
async function getCount(): Promise<string> {
  const count = await workoutRepo.count();
  return count.toString();
}
workoutRouter.get("/count", async (req, res) => {
  res.send(await getCount());
});

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

// Random
async function getRandom(): Promise<string> {
  const workouts = await workoutRepo
    .createQueryBuilder("w")
    .orderBy("RAND()")
    .getOne();
  return workouts.id;
}
workoutRouter.get("/random", async (req, res) => {
  res.send(await getRandom());
});

// search with pagination
async function getSearch(req): Promise<[Workout[], number]> {
  const { body } = req;
  let { take } = body;
  const { filters, skip } = body;

  if (!req.session.userId) {
    if (skip === 0) {
      take = 5;
    } else {
      return [[], 0];
    }
  }

  const qb = workoutRepo
    .createQueryBuilder("w")
    .innerJoinAndSelect("w.type", "type")
    .innerJoinAndSelect("w.difficulty", "difficulty")
    .innerJoinAndSelect("w.duration", "duration")
    .innerJoinAndSelect("w.user", "user");

  if (filters.name) {
    qb.andWhere("w.name LIKE :name", { name: `%${filters.name}%` });
  }
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
  if (filters.me) {
    qb.andWhere("w.user = :me", {
      me: req.session.userId,
    });
  }
  if (filters.favorited) {
    qb.innerJoin(
      "w.favoriteList",
      "favoriteList"
    ).andWhere("favoriteList.user = :id", { id: req.session.userId });
  }
  if (filters.date) {
    const d = new Date();
    if (parseInt(filters.date, 10) === 1) {
      d.setDate(d.getDate() - 1);
    }
    if (parseInt(filters.date, 10) === 2) {
      d.setDate(d.getDate() - 7);
    }
    if (parseInt(filters.date, 10) === 3) {
      d.setDate(d.getDate() - 30);
    }
    if (parseInt(filters.date, 10) === 4) {
      d.setDate(d.getDate() - 365);
    }
    qb.andWhere("w.createdAt >= :created", { created: d });
  }

  if (filters.top === "likes" || !filters.top) {
    qb.orderBy("w.likes", "DESC").orderBy("w.createdAt", "DESC");
  } else if (filters.top === "finishes") {
    qb.orderBy("w.finishes", "DESC").orderBy("w.createdAt", "DESC");
  } else if (filters.top === "new") {
    qb.orderBy("w.createdAt", "DESC");
  }
  const workouts = await qb.skip(skip).take(take).getManyAndCount();

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

  const newExercises = [];
  for await (const block of body.workout?.blocks) {
    for await (const exercise of block.exercises) {
      const { name } = exercise;
      const exercsieExists = await exerciseRepo.findOne({ name });

      if (!exercsieExists && !newExercises.some((el) => el.name === name)) {
        const newExercise = new Exercise();
        newExercise.name = name;
        newExercises.push(newExercise);
      }
    }
  }
  await exerciseRepo.save(newExercises);

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

// get like or dislike
async function getLikeWorkout(req): Promise<string> {
  const { body } = req;

  const like = await likeRepo.findOne({
    where: { user: req.session.userId, workout: body.id },
  });

  if (like) {
    return like.value.toString();
  }
  return "0";
}
workoutRouter.post("/getlike", isAuthenticated, async (req, res) => {
  res.send(await getLikeWorkout(req));
});

// like or dislike
async function likeWorkout(req): Promise<Boolean> {
  const { body } = req;

  const workout = await workoutRepo.findOne({ id: body.id });
  const user = await userRepo.findOne({ id: req.session.userId });
  const likeFound = await likeRepo.findOne({
    where: { user: user.id, workout: workout.id },
  });

  const value = body.likeOrDislike ? 1 : -1;

  if (!likeFound) {
    const like = new Like();
    like.user = user;
    like.workout = workout;
    like.value = value;
    workout.likes += value;
    likeRepo.save(like);
    workoutRepo.save(workout);
  } else {
    likeFound.value = value;
    workout.likes += value * 2;
    likeRepo.save(likeFound);
    workoutRepo.save(workout);
  }

  return true;
}
workoutRouter.post("/like", isAuthenticated, async (req, res) => {
  res.send(await likeWorkout(req));
});

// get favorite
async function getFavoriteWorkout(req): Promise<Boolean> {
  const { body } = req;

  const favorite = await favoriteRepo.findOne({
    where: { user: req.session.userId, workout: body.id },
  });

  if (favorite) {
    return true;
  }

  return false;
}
workoutRouter.post("/getfavorite", isAuthenticated, async (req, res) => {
  res.send(await getFavoriteWorkout(req));
});

// favorite
async function favoriteWorkout(req): Promise<Boolean> {
  const { body } = req;

  const workout = await workoutRepo.findOne({ id: body.id });
  const user = await userRepo.findOne({ id: req.session.userId });
  const favoriteFound = await favoriteRepo.findOne({
    where: { user: user.id, workout: workout.id },
  });

  if (!favoriteFound) {
    const favorite = new Favorite();
    favorite.user = user;
    favorite.workout = workout;
    favoriteRepo.save(favorite);
  } else {
    favoriteRepo.remove(favoriteFound);
  }

  return true;
}
workoutRouter.post("/favorite", isAuthenticated, async (req, res) => {
  res.send(await favoriteWorkout(req));
});

// view
async function viewWorkout(req, res): Promise<Boolean> {
  const { body } = req;
  const workout = await workoutRepo.findOne({ id: body.id });
  if (workout) {
    workout.views += 1;
    workoutRepo.save(workout);
  }
  return true;
}
workoutRouter.post("/view", async (req, res) => {
  res.send(await viewWorkout(req, res));
});

// finish
async function finishWorkout(req, res): Promise<Boolean> {
  const { body } = req;
  const workout = await workoutRepo.findOne({ id: body.id });
  workout.finishes += 1;
  workoutRepo.save(workout);
  return true;
}
workoutRouter.post("/finish", async (req, res) => {
  res.send(await finishWorkout(req, res));
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

// Exercises
async function getExercises(): Promise<Exercise[]> {
  const exercises = await exerciseRepo.find();
  return exercises;
}
workoutRouter.get("/exercises", async (req, res) => {
  res.send(await getExercises());
});

// import axios from "axios";
// import { v4 as uuid } from "uuid";

// workoutRouter.get("/readoldworkouts", async (req, res) => {
//   for (let i = 3; i < 79; i++) {
//     if ([65, 36, 16, 15, 14, 10, 7, 6, 5].includes(i)) continue;
//     await addWorkout(req, i);
//   }
//   res.send("done");
// });

// async function addWorkout(req, i) {
//   let {
//     data,
//   } = await axios.post(
//     "https://calisthenicsbackend.herokuapp.com/api/getworkout",
//     { id: i }
//   );

//   // eslint-disable-next-line prefer-destructuring
//   data = data[0];

//   const workout = new Workout();
//   workout.name = data.title;
//   workout.description = data.info;
//   workout.views = data.views;

//   // eslint-disable-next-line no-nested-ternary
//   const level =
//     data.level === "Beginner"
//       ? 1
//       : data.level === "Intermediate"
//       ? 2
//       : data.level === "Advanced"
//       ? 3
//       : -1;

//   const difficulty = await workoutDifficultyRepo.findOne(level);
//   workout.difficulty = difficulty;

//   // eslint-disable-next-line no-nested-ternary
//   const duration = await workoutDurationRepo.findOne(3);
//   workout.duration = duration;

//   // eslint-disable-next-line no-nested-ternary
//   const type = await workoutTypeRepo.findOne(8);
//   workout.type = type;

//   const user = await userRepo.findOne(req.session.userId);
//   workout.user = user;

//   const blocks = [];
//   data.workout.forEach((w) => {
//     const block = {};
//     block.id = uuid();

//     let type = "";
//     if (w.type === "circuit") type = "Circuit";
//     if (w.type === "emom") type = "EMOM";
//     if (w.type === "text") type = "Text";
//     block.type = type;

//     block.values = [w.var1, w.var2];
//     block.exercises = [];

//     w.exercises.forEach((e) => {
//       const exercise = {};
//       exercise.id = uuid();
//       exercise.count = e.var;
//       exercise.append = e.type;
//       exercise.name = e.exercise;
//       exercise.info = e.info;
//       block.exercises.push(exercise);
//     });

//     blocks.push(block);
//   });

//   //console.log(blocks);

//   workout.blocks = JSON.stringify(blocks);

//   await workoutRepo.save(workout);
//   console.log(i, " added");
// }

module.exports = workoutRouter;
