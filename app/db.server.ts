import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare global {
    var __db: PrismaClient | undefined;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure to only
// instantiate prisma once.
if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
} else {
    if (!global.__db) {
        global.__db = new PrismaClient();
    }
    prisma = global.__db;
}

export { prisma };

