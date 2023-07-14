import { getConnection } from "typeorm";
import { createAIWorkout } from "../../util/ai";

const AIRouter = require("express").Router();

AIRouter.post("/create", async (req, res) => {
  res.send(await createAIWorkout(req.body.message, getConnection()));
});

AIRouter.get("/alive", async (req, res) => {
  res.send("alive");
});

module.exports = AIRouter;
