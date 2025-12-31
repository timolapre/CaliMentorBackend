import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
redis.on("error", function (err) {
  console.log("Could not establish a connection with redis. ", err);
});
redis.on("connect", function (err) {
  console.log("Connected to redis successfully");
});

export { redis };
