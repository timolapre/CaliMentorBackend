import { getRepository } from "typeorm";

import { stripe } from "../../stripeService";
import { User } from "../../entities/user";
import { Exercise } from "../../entities/exercise";
import { Earning } from "../../entities/earning";

const paymentRouter = require("express").Router();

const userRepo = getRepository(User);
const exerciseRepo = getRepository(Exercise);
const earningRepo = getRepository(Earning);

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
paymentRouter.post("/premiumgift", async (req, res) => {
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
paymentRouter.post("/fakelogin", async (req, res) => {
  res.send(await fakeLogin(req));
});

// All admin users info
async function infoUsers(req): Promise<any> {
  const premiumUsers = await userRepo.findAndCount({ type: "premium" });
  const giftedPremiumUsers = await userRepo.findAndCount({
    type: "gifted_premium",
  });

  const freeUsers = await userRepo.findAndCount({ type: "free" });
  const expiredUsers = await userRepo.findAndCount({ type: "expired" });
  const canceledUsers = await userRepo.findAndCount({ type: "canceled" });

  return {
    premiumUsers,
    giftedPremiumUsers,
    freeUsers,
    expiredUsers,
    canceledUsers,
  };
}
paymentRouter.get("/users/info", async (req, res) => {
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
paymentRouter.post("/exercises/add", async (req, res) => {
  res.send(await addExercise(req));
});

async function approveExercise(req): Promise<boolean> {
  const exercise = await exerciseRepo.findOne({ name: req.body.name });
  exercise.approved = true;
  await exerciseRepo.save(exercise);
  return true;
}
paymentRouter.post("/exercises/approve", async (req, res) => {
  res.send(await approveExercise(req));
});

async function deleteExercise(req): Promise<boolean> {
  const exercise = await exerciseRepo.findOne({ name: req.body.name });
  if (exercise) {
    await exerciseRepo.remove(exercise);
  }
  return true;
}
paymentRouter.post("/exercises/delete", async (req, res) => {
  res.send(await deleteExercise(req));
});

// All admin exercises info
async function infoExercises(): Promise<Exercise[]> {
  const exercises = await exerciseRepo.find();
  return exercises;
}
paymentRouter.get("/exercises/info", async (req, res) => {
  res.send(await infoExercises());
});

// Earnings
async function getEarnings(): Promise<Earning[]> {
  const earnings = await earningRepo.find({ order: { month: "DESC" } });
  return earnings;
}
paymentRouter.get("/earnings", async (req, res) => {
  res.send(await getEarnings());
});

module.exports = paymentRouter;
