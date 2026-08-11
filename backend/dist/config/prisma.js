"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
/**
 * Singleton instance của PrismaClient để tương tác với Database PostgreSQL.
 */
exports.prisma = new client_1.PrismaClient();
