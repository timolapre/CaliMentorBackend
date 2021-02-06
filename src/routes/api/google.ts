import queryString from "query-string";
import { getRepository } from "typeorm";
import { urlGoogle, getGoogleAccountFromCode } from "../../googleUtil";
import { User } from "../../entities/user";

const googleRouter = require("express").Router();

const userRepo = getRepository(User);

async function googleUrl(): Promise<string> {
  return urlGoogle();
}
googleRouter.get("/url", async (req, res) => {
  res.send(await googleUrl());
});

async function googleRedirect(req, res) {
  const params = req.url.split("?")[1];
  const { code } = queryString.parse(params);
  const userData = await getGoogleAccountFromCode(code);

  let username = userData.name.replace(/\s/g, "").toLowerCase();
  let user = await userRepo.findOne({ googleId: userData.id });
  if (!user) {
    const userFound = await userRepo.findOne({ username });
    if (userFound) {
      username += Math.random() * 100000;
    }
    user = new User();
    user.username = username;
    user.email = userData.email;
    user.accessToken = userData.tokens.access_token;
    user.refreshToken = userData.tokens.refresh_token;
    user.googleId = userData.id;
    user.loginType = "google";
    user = await userRepo.save(user);
  }

  req.session.userId = user.id;

  res.redirect(process.env.GOOGLE_CLIENT_REDIRECT);
}
googleRouter.get("/redirect", async (req, res) => {
  res.send(await googleRedirect(req, res));
});

module.exports = googleRouter;
