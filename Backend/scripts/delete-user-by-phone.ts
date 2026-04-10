import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient({ log: ["error", "warn"] });

type ScriptOptions = {
  phone: string;
  dryRun: boolean;
  force: boolean;
};

function parseArgs(argv: string[]): ScriptOptions {
  let phone = "";
  let dryRun = false;
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--phone" && argv[i + 1]) {
      phone = argv[i + 1].trim();
      i += 1;
      continue;
    }

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }
  }

  if (!phone) {
    throw new Error(
      "Missing --phone argument. Example: npm run user:delete:phone -- --phone 9016097116 --force",
    );
  }

  return { phone, dryRun, force };
}

function buildPhoneFilter(inputPhone: string) {
  const compact = inputPhone.replace(/\s+/g, "").replace(/-/g, "");
  const digitsOnly = compact.replace(/\D/g, "");
  const tail10 = digitsOnly.length >= 10 ? digitsOnly.slice(-10) : undefined;

  const candidates = new Set<string>();
  candidates.add(compact);

  if (compact.startsWith("+") && digitsOnly) {
    candidates.add(digitsOnly);
  }

  if (!compact.startsWith("+") && digitsOnly) {
    candidates.add(`+${digitsOnly}`);
  }

  if (digitsOnly.length === 10) {
    // India default fallback for local test input like 9016097116.
    candidates.add(`+91${digitsOnly}`);
  }

  const phoneEquals = Array.from(candidates).filter(Boolean);

  return {
    phoneEquals,
    tail10,
  };
}

function buildWhereClause(phoneEquals: string[], tail10?: string) {
  const orClauses: Array<
    { phone: { in: string[] } } | { phone: { endsWith: string } }
  > = [];

  if (phoneEquals.length > 0) {
    orClauses.push({ phone: { in: phoneEquals } });
  }

  if (tail10) {
    orClauses.push({ phone: { endsWith: tail10 } });
  }

  if (orClauses.length === 0) {
    throw new Error("Could not build a valid phone filter from input.");
  }

  return { OR: orClauses };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (nodeEnv === "production" && !options.force) {
    throw new Error(
      "Refusing to run in production without --force. This script deletes user data.",
    );
  }

  const { phoneEquals, tail10 } = buildPhoneFilter(options.phone);
  const userWhere = buildWhereClause(phoneEquals, tail10);
  const otpWhere = buildWhereClause(phoneEquals, tail10);

  console.log("Target phone input:", options.phone);
  console.log("Generated exact candidates:", phoneEquals);
  console.log("Generated tail match:", tail10 ?? "(none)");

  const matchingUsers = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, phone: true, email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const matchingOtpCount = await prisma.oTPVerification.count({
    where: otpWhere,
  });

  console.log("Matching users:", matchingUsers.length);
  if (matchingUsers.length > 0) {
    console.table(matchingUsers);
  }
  console.log("Matching OTP rows:", matchingOtpCount);

  if (options.dryRun) {
    console.log("Dry run complete. No data was deleted.");
    return;
  }

  const userIds = matchingUsers.map((u) => u.id);

  const result = await prisma.$transaction(async (tx) => {
    let deletedDailyTasks = 0;
    let deletedUsers = 0;

    if (userIds.length > 0) {
      const dailyTaskDelete = await tx.userDailyTask.deleteMany({
        where: { userId: { in: userIds } },
      });
      deletedDailyTasks = dailyTaskDelete.count;

      const userDelete = await tx.user.deleteMany({
        where: { id: { in: userIds } },
      });
      deletedUsers = userDelete.count;
    }

    const otpDelete = await tx.oTPVerification.deleteMany({ where: otpWhere });

    return {
      deletedDailyTasks,
      deletedUsers,
      deletedOtpRows: otpDelete.count,
    };
  });

  const remainingUsers = await prisma.user.count({ where: userWhere });
  const remainingOtpRows = await prisma.oTPVerification.count({
    where: otpWhere,
  });

  console.log("Deletion complete:", result);
  console.log("Post-check remaining users:", remainingUsers);
  console.log("Post-check remaining OTP rows:", remainingOtpRows);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Script failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
