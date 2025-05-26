import { PrismaClient } from "@generated/prisma"; // IMPORTANT: Always import prisma client and everything you need from prisma, from the alias '@generated/prisma'

export const client = new PrismaClient();
