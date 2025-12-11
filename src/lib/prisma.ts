// src/lib/prisma.ts
import { PrismaClient } from "@/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// 1. Create pool + adapter for Postgres
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 2. Singleton pattern so dev hot reload doesn’t spam connections
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
