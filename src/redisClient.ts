import Redis from "ioredis";

const redis = new Redis();
redis.on("error", function (err) {
  console.log("Could not establish a connection with redis. ", err);
});
redis.on("connect", function (err) {
  console.log("Connected to redis successfully");
});

export { redis };
