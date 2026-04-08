const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();
const baseUrl = "http://localhost:4000";

const samplePhoto =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAz/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

function pass(step) {
  console.log(`PASS: ${step}`);
}

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
  if (!process.env.JWT_SECRET) {
    fail("env", "JWT_SECRET missing");
  }

  const suffix = Date.now();
  const mainUser = await prisma.user.create({
    data: {
      email: `smoke_profile_${suffix}@example.com`,
      timezone: "UTC",
      name: "Initial Name",
      username: `smokeprofile${suffix}`,
      wallet: { create: {} },
      streak: { create: {} },
    },
    select: { id: true },
  });

  const conflictUser = await prisma.user.create({
    data: {
      email: `smoke_profile_conflict_${suffix}@example.com`,
      timezone: "UTC",
      username: `smokeprofile_taken_${suffix}`,
    },
    select: { username: true },
  });

  const lockedUser = await prisma.user.create({
    data: {
      email: `smoke_profile_locked_${suffix}@example.com`,
      timezone: "UTC",
      username: `smokeprofile_locked_${suffix}`,
      isProfileComplete: true,
    },
    select: { id: true, username: true },
  });

  const token = jwt.sign({ sub: mainUser.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const lockedToken = jwt.sign({ sub: lockedUser.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  pass("created smoke users and auth tokens");

  const initial = await http("GET", "/profile", token);
  if (initial.res.status !== 200 || !initial.data?.success) {
    fail("get profile", { status: initial.res.status, body: initial.data });
  }
  pass("get profile");

  const partialUpdate = await http("PATCH", "/profile", token, {
    name: "Ameya Shimpi",
    profession: "Interior Designer",
    about: "Loves coffee & morning walks",
    isPrivate: true,
    emailNotificationsEnabled: false,
  });

  if (partialUpdate.res.status !== 200 || !partialUpdate.data?.success) {
    fail("patch basic fields", {
      status: partialUpdate.res.status,
      body: partialUpdate.data,
    });
  }

  if (!partialUpdate.data?.data?.isPrivate) {
    fail("patch privacy field persisted", partialUpdate.data?.data);
  }

  if (partialUpdate.data?.data?.emailNotificationsEnabled !== false) {
    fail("patch email preference persisted", partialUpdate.data?.data);
  }

  pass("patch basic fields and preferences");

  const photoUpdate = await http("PATCH", "/profile", token, {
    profilePhoto: samplePhoto,
  });

  if (photoUpdate.res.status !== 200 || !photoUpdate.data?.success) {
    fail("patch profile photo", {
      status: photoUpdate.res.status,
      body: photoUpdate.data,
    });
  }

  pass("patch profile photo base64");

  const emptyBody = await http("PATCH", "/profile", token, {});
  if (emptyBody.res.status !== 400) {
    fail("reject empty patch body", {
      status: emptyBody.res.status,
      body: emptyBody.data,
    });
  }
  pass("reject empty patch body");

  const usernameConflict = await http("PATCH", "/profile", token, {
    username: conflictUser.username,
  });

  if (usernameConflict.res.status !== 409) {
    fail("reject duplicate username", {
      status: usernameConflict.res.status,
      body: usernameConflict.data,
    });
  }
  pass("reject duplicate username");

  const lockedUsernameChange = await http("PATCH", "/profile", lockedToken, {
    username: `locked_new_${suffix}`,
  });

  if (lockedUsernameChange.res.status !== 400) {
    fail("reject username change after profile complete", {
      status: lockedUsernameChange.res.status,
      body: lockedUsernameChange.data,
    });
  }

  pass("reject username change after profile complete");

  console.log("Profile smoke test complete: all checks passed.");
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
