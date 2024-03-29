import { isAdmin, isAuthenticated } from "../util/authentication";

/* eslint-disable import/newline-after-import */
const apiRouter = require("express").Router();

apiRouter.get("/alive", async (req, res) => {
  res.send("alive");
});

const user = require("./api/user");
apiRouter.use("/user", user);

const workout = require("./api/workout");
apiRouter.use("/workout", workout);

const exercise = require("./api/exercise");
apiRouter.use("/exercise", exercise);

const personalRecord = require("./api/personalrecord");
apiRouter.use("/personalrecord", personalRecord);

const goal = require("./api/goal");
apiRouter.use("/goal", goal);

const payment = require("./api/payment");
apiRouter.use("/payment", payment);

const creator = require("./api/creator");
apiRouter.use("/creator", isAuthenticated, creator);

const admin = require("./api/admin");
apiRouter.use("/admin", isAdmin, admin);

const ai = require("./api/ai");
apiRouter.use("/ai", isAdmin, ai);

const google = require("./api/google");
apiRouter.use("/google", google);

module.exports = apiRouter;
