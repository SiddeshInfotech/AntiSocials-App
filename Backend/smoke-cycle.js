const { PrismaClient, LifeCircleParameter } = require("@prisma/client");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();
const baseUrl = "http://localhost:4000";

const CASES = [
  { daysAgo: 0, expectedLevel: 1, expectedHard: 0 },
  { daysAgo: 21, expectedLevel: 2, expectedHard: 1 },
  { daysAgo: 42, expectedLevel: 3, expectedHard: 2 },
  { daysAgo: 63, expectedLevel: 4, expectedHard: 3 },
  { daysAgo: 84, expectedLevel: 5, expectedHard: 4 },
];

function fail(step, detail) {
  console.error(`FAIL: ${step}`);
  if (detail) {
    try {
      console.error(JSON.stringify(detail, null, 2));
    } catch {
      console.error(detail);
    }
  }
  process.exit(1);
}

function pass(step) {
  console.log(`PASS: ${step}`);
}

function dateDaysAgo(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function http(method, path, token) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

async function createUserWithStreak(daysAgo) {
  const email = `cycle_${daysAgo}_${Date.now()}@example.com`;
  const journeyStartDate = dateDaysAgo(daysAgo);

  const user = await prisma.user.create({
    data: {
      email,
      timezone: "UTC",
      wallet: { create: {} },
      streak: {
        create: {
          journeyStartDate,
          currentLevelStartDate: journeyStartDate,
          cycleDay: 1,
          currentLevel: 1,
        },
      },
      lifeCircleScores: {
        createMany: {
          data: Object.values(LifeCircleParameter).map((parameter) => ({
            parameter,
            score: 0,
          })),
        },
      },
    },
    select: { id: true, email: true },
  });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  return { user, token };
}

(async () => {
  if (!process.env.JWT_SECRET) {
    fail("env", "JWT_SECRET missing");
  }

  // Ensure there are no stale assignments for created smoke users.
  pass("starting cycle smoke test");

  for (const testCase of CASES) {
    const { daysAgo, expectedLevel, expectedHard } = testCase;
    const { token } = await createUserWithStreak(daysAgo);

    const today = await http("GET", "/tasks/today", token);
    if (today.res.status !== 200 || !today.data?.success) {
      fail(`tasks/today L${expectedLevel}`, {
        status: today.res.status,
        body: today.data,
      });
    }

    const tasks = today.data.data;
    const progress = today.data.progress;

    if (!Array.isArray(tasks)) {
      fail(`tasks array L${expectedLevel}`, today.data);
    }

    if (tasks.length !== 7) {
      fail(`7 tasks/day L${expectedLevel}`, {
        expected: 7,
        actual: tasks.length,
      });
    }

    const hardCount = tasks.filter(
      (item) => item?.task?.difficulty === "HARD",
    ).length;

    if (hardCount !== expectedHard) {
      fail(`hard mix L${expectedLevel}`, {
        expectedHard,
        actualHard: hardCount,
        difficulties: tasks.map((item) => item?.task?.difficulty),
        titles: tasks.map((item) => item?.task?.title),
      });
    }

    if (!progress || progress.currentLevel !== expectedLevel) {
      fail(`progress level L${expectedLevel}`, {
        expectedLevel,
        progress,
      });
    }

    const uniqueTaskIds = new Set(tasks.map((item) => item.taskId));
    if (uniqueTaskIds.size !== tasks.length) {
      fail(`unique daily tasks L${expectedLevel}`, {
        total: tasks.length,
        unique: uniqueTaskIds.size,
      });
    }

    pass(`L${expectedLevel}: 7 tasks + ${expectedHard} hard + progress OK`);
  }

  pass("all cycle smoke cases passed");
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
