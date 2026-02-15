import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const password = process.env.DB_PASSWORD ?? "";
const host = process.env.DB_HOST ?? "aws-0-us-west-2.pooler.supabase.com";
const port = process.env.DB_PORT ?? "6543";
const user = process.env.DB_USER ?? "postgres.rsljybzhzjiyvekbehsi";
const database = process.env.DB_NAME ?? "postgres";

const connectionUrl = new URL("postgresql://localhost");
connectionUrl.username = user;
connectionUrl.password = password;
connectionUrl.host = `${host}:${port}`;
connectionUrl.pathname = `/${database}`;
connectionUrl.searchParams.set("sslmode", "require");
connectionUrl.searchParams.set("uselibpqcompat", "true");

const connectionString = connectionUrl.toString();

const rejectUnauthorizedEnv = process.env.DB_SSL_REJECT_UNAUTHORIZED;
const ssl =
  rejectUnauthorizedEnv === undefined
    ? undefined
    : { rejectUnauthorized: rejectUnauthorizedEnv !== "false" };

const adapter = new PrismaPg({
  connectionString,
  ...(ssl ? { ssl } : {}),
});

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Avoid noisy logs for expected transient errors (ex: during local setup when tables are missing).
    // If you want Prisma query errors printed, set `PRISMA_LOG_ERRORS=1`.
    log: process.env.PRISMA_LOG_ERRORS === "1" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
