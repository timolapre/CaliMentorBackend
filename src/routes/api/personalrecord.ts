import { getRepository } from "typeorm";
import { User } from "../../entities/user";
import { isAuthenticated, isPremium2 } from "../../util/authentication";
import { PersonalRecord } from "../../entities/personalRecord";
import { PersonalRecordHistory } from "../../entities/personalRecordHistory";

const personalRecordRouter = require("express").Router();

const personalRecordRepo = getRepository(PersonalRecord);
const personalRecordHistoryRepo = getRepository(PersonalRecordHistory);
const userRepo = getRepository(User);

async function getPersonalRecords(req): Promise<PersonalRecord[]> {
  const prs = await personalRecordRepo
    .createQueryBuilder("pr")
    .where("pr.user = :user", { user: req.session.userId })
    .orderBy("pr.createdAt", "ASC")
    .innerJoinAndSelect("pr.history", "h")
    .addOrderBy("h.createdAt", "DESC")
    .getMany();

  return prs;
}
personalRecordRouter.get("/all", isAuthenticated, async (req, res) => {
  res.send(await getPersonalRecords(req));
});

async function getPersonalRecord(req): Promise<PersonalRecord> {
  const pr = await personalRecordRepo
    .createQueryBuilder("pr")
    .where("pr.user = :user", { user: req.session.userId })
    .andWhere("pr.id = :id", { id: req.body.id })
    .orderBy("pr.createdAt", "ASC")
    .innerJoinAndSelect("pr.history", "h")
    .addOrderBy("h.createdAt", "DESC")
    .getOne();

  return pr;
}
personalRecordRouter.post("/one", isAuthenticated, async (req, res) => {
  res.send(await getPersonalRecord(req));
});

// async function editPersonalRecord(req): Promise<PersonalRecord> {
//   const { id, exercise, count, append } = req.body;

//   const pr = await personalRecordRepo.findOne({
//     where: { id },
//     relations: ["user"],
//   });

//   if (pr.user.id !== req.session.userId) {
//     return null;
//   }

//   pr.exercise = exercise;
//   pr.count = count;
//   pr.append = append;

//   await personalRecordRepo.save(pr);
//   return pr;
// }
// personalRecordRouter.post("/edit", isAuthenticated, async (req, res) => {
//   res.send(await editPersonalRecord(req));
// });

async function addPersonalRecord(req): Promise<string | number> {
  const { exercise, count, append, id } = req.body;

  let pr = await personalRecordRepo.findOne({ id });
  if (!pr) {
    if (!(await isPremium2(req))) {
      const prCount = await personalRecordRepo.find({
        user: req.session.userId,
      });
      if (prCount.length + 1 > 4) {
        return 401;
      }
    }

    pr = new PersonalRecord();
    pr.user = req.session.userId;
    pr.exercise = exercise;
    pr.append = append;
    pr = await personalRecordRepo.save(pr);
  }
  const prHistory = new PersonalRecordHistory();
  prHistory.PersonalRecord = pr;
  prHistory.count = count;
  personalRecordHistoryRepo.save(prHistory);

  return pr.id;
}
personalRecordRouter.post("/add", isAuthenticated, async (req, res) => {
  res.send(await addPersonalRecord(req));
});

async function deletePersonalRecord(req): Promise<boolean> {
  const { id } = req.body;
  await personalRecordRepo.delete({ id });
  return true;
}
personalRecordRouter.post("/delete", isAuthenticated, async (req, res) => {
  res.send(await deletePersonalRecord(req));
});

module.exports = personalRecordRouter;
