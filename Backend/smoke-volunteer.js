const {
  PrismaClient,
  TaskStatus,
  LifeCircleParameter,
} = require("@prisma/client");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();
const baseUrl = "http://localhost:4000";

const samplePhoto =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAz/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

function ok(name) {
  console.log(`PASS: ${name}`);
}

function fail(name, detail) {
  console.error(`FAIL: ${name}`);
  if (detail) {
    if (typeof detail === "object") {
      console.error(JSON.stringify(detail, null, 2));
    } else {
      console.error(detail);
    }
  }
  process.exit(1);
}

async function http(method, path, token, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { res, data };
}

(async () => {
  const email = `smoke_${Date.now()}@example.com`;

  console.log("Starting volunteer smoke test...");

  const user = await prisma.user.create({
    data: {
      email,
      timezone: "UTC",
      wallet: { create: {} },
      streak: { create: {} },
      lifeCircleScores: {
        createMany: {
          data: Object.values(LifeCircleParameter).map((parameter) => ({
            parameter,
            score: 0,
          })),
        },
      },
    },
  });
  ok("create smoke test user");

  if (!process.env.JWT_SECRET) {
    fail("jwt secret", "JWT_SECRET is missing in environment");
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  ok("create auth token");

  const volunteerTask = await prisma.task.findFirst({
    where: { title: "Volunteer for 1 hour", isActive: true },
  });
  if (!volunteerTask) fail("find volunteer task", "Task not found");
  ok("find volunteer task");

  const subtasksResp = await http(
    "GET",
    `/tasks/${volunteerTask.id}/subtasks`,
    token,
  );
  if (
    subtasksResp.res.status !== 200 ||
    !Array.isArray(subtasksResp.data?.data)
  ) {
    fail("get subtasks", subtasksResp.data || subtasksResp.res.status);
  }
  const subtasks = subtasksResp.data.data;
  if (subtasks.length < 8) {
    fail("get subtasks count", `Expected >=8, got ${subtasks.length}`);
  }
  ok("get subtasks");

  const smokeSubtask = await prisma.subtask.create({
    data: {
      taskId: volunteerTask.id,
      title: `Smoke Subtask ${Date.now()}`,
      description: "Temporary smoke test subtask",
      icon: "🧪",
      isActive: true,
    },
  });
  const selectedSubtaskId = smokeSubtask.id;
  ok("create uuid smoke subtask");

  const insertedDailyTask = await prisma.userDailyTask.create({
    data: {
      userId: user.id,
      taskId: volunteerTask.id,
      assignedDate: new Date(),
      status: TaskStatus.PENDING,
    },
  });
  ok("create pending volunteer assignment");

  const missingPhoto = await http(
    "POST",
    `/tasks/${insertedDailyTask.id}/complete`,
    token,
    { subtaskId: selectedSubtaskId },
  );
  if (missingPhoto.res.status !== 400) {
    fail("missing photo validation", {
      status: missingPhoto.res.status,
      body: missingPhoto.data,
    });
  }
  ok("missing photo validation");

  const missingSubtask = await http(
    "POST",
    `/tasks/${insertedDailyTask.id}/complete`,
    token,
    { photoBase64: samplePhoto },
  );
  if (missingSubtask.res.status !== 400) {
    fail("missing subtask validation", {
      status: missingSubtask.res.status,
      body: missingSubtask.data,
    });
  }
  ok("missing subtask validation");

  const complete = await http(
    "POST",
    `/tasks/${insertedDailyTask.id}/complete`,
    token,
    {
      subtaskId: selectedSubtaskId,
      photoBase64: samplePhoto,
    },
  );
  if (complete.res.status !== 200 || !complete.data?.success) {
    fail("complete volunteer task", {
      status: complete.res.status,
      body: complete.data,
    });
  }
  ok("complete volunteer task");

  const wallet = await http("GET", "/wallet", token);
  if (wallet.res.status !== 200 || !wallet.data?.data) {
    fail("wallet fetch", wallet.data || wallet.res.status);
  }
  if ((wallet.data.data.balance ?? 0) < 35) {
    fail("wallet update", wallet.data.data);
  }
  ok("wallet update");

  const streak = await http("GET", "/streak", token);
  if (streak.res.status !== 200 || !streak.data?.data) {
    fail("streak fetch", streak.data || streak.res.status);
  }
  ok("streak fetch");

  const completion = await prisma.userTaskCompletion.findUnique({
    where: { userDailyTaskId: insertedDailyTask.id },
    select: {
      subtaskId: true,
      photoBase64: true,
      photoUploadedAt: true,
      pointsEarned: true,
    },
  });

  if (!completion) {
    fail("db completion record", "No completion row found");
  }

  if (
    !completion.subtaskId ||
    !completion.photoBase64 ||
    !completion.photoUploadedAt
  ) {
    fail("db photo/subtask persistence", completion);
  }

  ok("db photo/subtask persistence");
  console.log("Smoke test complete: all checks passed.");

  await prisma.$disconnect();
  process.exit(0);
})().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
