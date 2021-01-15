import { getRepository } from "typeorm";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { User } from "../../entities/user";
import { COOKIE_NAME } from "../../constants";

const userRouter = require("express").Router();

const userRepo = getRepository(User);

class UserResponse {
  errors?: Object;

  user?: User;
}

// me
userRouter.get("/me", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.send(null);
  }

  const meUser = await userRepo.findOne(req.session.userId);
  res.send(meUser);
});

// register
async function postRegister(req): Promise<UserResponse> {
  const { username, email, password, repeatPassword, country } = req.body;

  if (!username || username.length <= 2) {
    return {
      errors: {
        username: "length should be greater than 2",
      },
    };
  }

  if (!email || !email.includes("@")) {
    return {
      errors: {
        email: "should be an email",
      },
    };
  }

  if (!password || password.length <= 3 || password.indexOf(" ") >= 0) {
    return {
      errors: {
        password: "length should be greater than 3 with no spaces",
      },
    };
  }

  if (!repeatPassword || repeatPassword !== password) {
    return {
      errors: {
        repeatPassword: "passwords do not match",
      },
    };
  }

  if (!country) {
    return {
      errors: {
        country: "fill in your country",
      },
    };
  }

  const userDuplicate = await userRepo.findOne({
    username: username.toLowerCase(),
  });

  if (userDuplicate) {
    return {
      errors: {
        username: "username already taken",
      },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = userRepo.create({
    username: username.toLowerCase(),
    email,
    password: hashedPassword,
  });
  const newUser = await userRepo.save(user);

  req.session.userId = user.id;

  return { user: newUser };
}
userRouter.post("/register", async (req: Request, res: Response) => {
  res.send(await postRegister(req));
});

// login
async function postLogin(req): Promise<UserResponse> {
  const { username, password } = req.body;

  const user = await userRepo
    .createQueryBuilder("user")
    .addSelect("user.password")
    .where("user.username = :username", { username: username.toLowerCase() })
    .getOne();

  if (!user) {
    return {
      errors: {
        username: "username doesn't exist",
      },
    };
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return {
      errors: {
        password: "incorrect password",
      },
    };
  }

  req.session.userId = user.id;

  return { user };
}
userRouter.post("/login", async (req: Request, res: Response) => {
  res.send(await postLogin(req));
});

userRouter.get("/logout", async (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.send(
    new Promise((resolve) =>
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolve(false);
        }
        resolve(true);
      })
    )
  );
});

module.exports = userRouter;
