import { PrismaClient } from '@prisma/client';

/**
 * Singleton instance của PrismaClient để tương tác với Database PostgreSQL.
 */
export const prisma = new PrismaClient();
