import { PrismaNeon } from "@prisma/adapter-neon";
import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
type PrismaClientInstance = InstanceType<typeof PrismaClient>;

declare global {
  var __prisma__: PrismaClientInstance | undefined;
}

function createPrismaClient(): PrismaClientInstance {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma__ = prisma;
}
