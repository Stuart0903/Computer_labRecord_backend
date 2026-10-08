
import { app } from "./app.js";
import { env } from "./config/env.js";
import prisma from "./lib/prisma.js"


await prisma.$connect();
console.log('✅ Connected to PostgreSQL');

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});

// Handle unhandled rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});