// backend/prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

// These help verify the environment is loaded correctly during development
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Loaded" : "Missing");
console.log("DIRECT_URL:", process.env.DIRECT_URL ? "Loaded" : "Missing");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI (migrations) uses the DIRECT connection
    url: process.env.DIRECT_URL,
  },
});