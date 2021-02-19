import { getRepository } from "typeorm";
import { User } from "../../entities/user";
import { isAuthenticated, isPremium2 } from "../../util/authentication";
import { Goal } from "../../entities/goal";

const goalRouter = require("express").Router();

const goalRepo = getRepository(Goal);
const userRepo = getRepository(User);

async function getGoals(req): Promise<Goal[]> {
  const goals = await goalRepo.find({
    where: { user: req.session.userId, done: 0 },
    order: { deadline: "ASC" },
  });
  return goals;
}
goalRouter.get("/all", isAuthenticated, async (req, res) => {
  res.send(await getGoals(req));
});

async function getGoal(req): Promise<Goal> {
  const goal = await goalRepo.findOne({
    user: req.session.userId,
    id: req.body.id,
  });
  return goal;
}
goalRouter.post("/one", isAuthenticated, async (req, res) => {
  res.send(await getGoal(req));
});

async function editGoal(req): Promise<Goal> {
  const { id, exercise, count, append, deadline } = req.body;

  const goal = await goalRepo.findOne({
    where: { id },
    relations: ["user"],
  });

  if (goal.user.id !== req.session.userId) {
    return null;
  }

  goal.exercise = exercise;
  goal.count = count;
  goal.append = append;
  goal.deadline = deadline || null;

  await goalRepo.save(goal);
  return goal;
}
goalRouter.post("/edit", isAuthenticated, async (req, res) => {
  res.send(await editGoal(req));
});

async function addGoal(req): Promise<Goal | number> {
  const { exercise, count, append, deadline } = req.body;

  if (!(await isPremium2(req))) {
    const goalCount = await goalRepo.find({
      user: req.session.userId,
      done: false,
    });
    if (goalCount.length + 1 > 2) {
      return 401;
    }
  }

  let goal = new Goal();
  goal.user = req.session.userId;
  goal.exercise = exercise;
  goal.count = count;
  goal.append = append;
  goal.deadline = deadline || null;

  goal = await goalRepo.save(goal);
  return goal;
}
goalRouter.post("/add", isAuthenticated, async (req, res) => {
  res.send(await addGoal(req));
});

async function goalDone(req): Promise<boolean> {
  const goal = await goalRepo.findOne({
    user: req.session.userId,
    id: req.body.id,
  });
  goal.done = true;
  goalRepo.save(goal);

  return true;
}
goalRouter.post("/done", isAuthenticated, async (req, res) => {
  res.send(await goalDone(req));
});

module.exports = goalRouter;
