/* eslint-disable import/newline-after-import */
const apiRouter = require("express").Router();

const user = require("./api/user");
apiRouter.use("/user", user);

const workout = require("./api/workout");
apiRouter.use("/workout", workout);

module.exports = apiRouter;
