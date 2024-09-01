import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-6",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  // store: ... , // Redis, Memcached, etc. See below.
});
