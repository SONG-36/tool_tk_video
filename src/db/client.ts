import { PrismaClient } from "@prisma/client";

import "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  __prisma__?: PrismaClient;
};

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.__prisma__) {
    globalForPrisma.__prisma__ = new PrismaClient();
  }

  return globalForPrisma.__prisma__;
}

export const prisma = getPrismaClient();
