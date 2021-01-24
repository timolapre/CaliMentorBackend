import { getRepository } from "typeorm";
import { User } from "../../entities/user";
import { isAuthenticated } from "../../util/authentication";
import { PersonalRecord } from "../../entities/PersonalRecord";

const personalRecordRouter = require("express").Router();

const personalRecordRepo = getRepository(PersonalRecord);
const userRepo = getRepository(User);

async function getPersonalRecords(req): Promise<PersonalRecord[]> {
  const prs = await personalRecordRepo.find({
    where: { user: req.session.userId },
    order: { createdAt: "ASC" },
  });
  return prs;
}
personalRecordRouter.get("/all", isAuthenticated, async (req, res) => {
  res.send(await getPersonalRecords(req));
});

async function getPersonalRecord(req): Promise<PersonalRecord> {
  const pr = await personalRecordRepo.findOne({
    user: req.session.userId,
    id: req.body.id,
  });
  return pr;
}
personalRecordRouter.post("/one", isAuthenticated, async (req, res) => {
  res.send(await getPersonalRecord(req));
});

async function editPersonalRecord(req): Promise<PersonalRecord> {
  const { id, exercise, count, append } = req.body;

  const pr = await personalRecordRepo.findOne({
    where: { id },
    relations: ["user"],
  });

  if (pr.user.id !== req.session.userId) {
    return null;
  }

  pr.exercise = exercise;
  pr.count = count;
  pr.append = append;

  await personalRecordRepo.save(pr);
  return pr;
}
personalRecordRouter.post("/edit", isAuthenticated, async (req, res) => {
  res.send(await editPersonalRecord(req));
});

async function addPersonalRecord(req): Promise<PersonalRecord> {
  const { exercise, count, append } = req.body;

  const user = await userRepo.findOne({ id: req.session.userId });

  let pr = new PersonalRecord();
  pr.user = user;
  pr.exercise = exercise;
  pr.count = count;
  pr.append = append;

  pr = await personalRecordRepo.save(pr);
  return pr;
}
personalRecordRouter.post("/add", isAuthenticated, async (req, res) => {
  res.send(await addPersonalRecord(req));
});

module.exports = personalRecordRouter;
