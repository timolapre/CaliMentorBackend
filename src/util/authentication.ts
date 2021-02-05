import { getRepository } from "typeorm";
import { User } from "../entities/user";

const userRepo = getRepository(User);

export async function isAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.sendStatus(401);
  }

  const user = await userRepo.findOne(req.session.userId);
  if (user.username.toLocaleLowerCase() !== "timo") {
    return res.sendStatus(401);
  }
  return next();
}

export async function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.sendStatus(401);
  }
  return next();
}

export async function isAuthenticated2(req) {
  if (!req.session.userId) {
    return false;
  }
  return true;
}

export async function isPremium(req, res, next) {
  if (!req.session.userId) {
    return res.sendStatus(401);
  }

  const user = await userRepo.findOne(req.session.userId);

  if (user.premiumExpireDate < new Date()) {
    user.type = "expired";
    userRepo.save(user);
    return res.sendStatus(401);
  }

  if (user.type === "free") {
    return res.sendStatus(401);
  }

  return next();
}

export async function isPremium2(req): Promise<Boolean> {
  if (!req.session.userId) {
    return false;
  }

  const user = await userRepo.findOne(req.session.userId);
  if (user.type === "free") {
    return false;
  }

  return true;
}
