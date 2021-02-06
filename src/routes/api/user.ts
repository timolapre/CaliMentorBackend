import { getRepository } from "typeorm";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { Request, Response } from "express";
import { User } from "../../entities/user";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../../constants";
import { sendEmail } from "../../util/sendEmail";
import { redis } from "../../redisClient";
import { isAuthenticated } from "../../util/authentication";

const userRouter = require("express").Router();

const userRepo = getRepository(User);

class UserResponse {
  errors?: Object;

  user?: User;
}

// count
async function getCount(): Promise<string> {
  const count = await userRepo.count();
  return count.toString();
}
userRouter.get("/count", async (req, res) => {
  res.send(await getCount());
});

// me
userRouter.get("/me", async (req: Request, res: Response) => {
  const meUser = await userRepo
    .createQueryBuilder("u")
    .addSelect("u.email")
    .where("u.id = :id", { id: req.session.userId })
    .getOne();

  res.send(meUser);
});

// update account info
async function updateMe(req): Promise<UserResponse> {
  const { username, email } = req.body.user;

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

  const checkUsername = await userRepo.findOne({ username });
  if (checkUsername && checkUsername.id !== req.session.userId) {
    return {
      errors: {
        username: "username already taken",
      },
    };
  }

  const meUser = await userRepo
    .createQueryBuilder("u")
    .addSelect("u.email")
    .where("u.id = :id", { id: req.session.userId })
    .getOne();

  meUser.username = username;
  meUser.email = email;

  const user = await userRepo.save(meUser);
  return { user };
}
userRouter.post(
  "/me/update",
  isAuthenticated,
  async (req: Request, res: Response) => {
    res.send(await updateMe(req));
  }
);

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
    loginType: "email",
    
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

  if (!user || !password) {
    return {
      errors: {
        all: "Login failed",
      },
    };
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return {
      errors: {
        all: "Login failed",
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

// forgot password
async function forgotPassword(req): Promise<boolean> {
  const { email } = req.body;
  const user = await userRepo.findOne({ email });
  if (!user) {
    return true;
  }

  const token = uuid();

  await redis.set(
    FORGOT_PASSWORD_PREFIX + token,
    user.id,
    "ex",
    1000 * 60 * 60 * 24 // 1 day
  );

  const html = `<a href="http://localhost:3000/resetpassword/${token}">Reset password</>`;
  await sendEmail(email, html);

  return true;
}
userRouter.post("/forgotpassword", async (req: Request, res: Response) => {
  res.send(await forgotPassword(req));
});

// reset password
async function resetPassword(req): Promise<UserResponse> {
  const { password, repeatPassword, token } = req.body;

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

  const id = await redis.get(FORGOT_PASSWORD_PREFIX + token);
  if (!id) {
    return {
      errors: {
        invalid: "token not valid",
      },
    };
  }
  await redis.del(FORGOT_PASSWORD_PREFIX + token);
  let user = await userRepo.findOne(id);
  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user = await userRepo.save(user);

  return { user };
}
userRouter.post("/resetpassword", async (req: Request, res: Response) => {
  res.send(await resetPassword(req));
});

// change password
async function changepassword(req): Promise<UserResponse> {
  const { password, repeatPassword } = req.body;

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

  const meUser = await userRepo
    .createQueryBuilder("u")
    .where("u.id = :id", { id: req.session.userId })
    .getOne();

  const hashedPassword = await bcrypt.hash(password, 10);
  meUser.password = hashedPassword;
  const user = await userRepo.save(meUser);

  return { user };
}
userRouter.post(
  "/me/changepassword",
  isAuthenticated,
  async (req: Request, res: Response) => {
    res.send(await changepassword(req));
  }
);

// Edit routine
async function editRoutine(req) {
  const user = await userRepo.findOne(req.session.userId);
  user.routine = JSON.stringify(req.body.routine);
  userRepo.save(user);
}
userRouter.post("/routine", async (req: Request, res: Response) => {
  res.send(await editRoutine(req));
});

module.exports = userRouter;
