const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
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

  const user = await prisma.user.create({
    data: {
      phone: `+9199${String(suffix).slice(-8)}`,
      timezone: "UTC",
      wallet: { create: {} },
      streak: { create: {} },
    },
    select: { id: true, isProfileComplete: true },
  });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    jwtid: randomUUID(),
  });

  pass("created smoke user and token");

  const completeSignup = await http("POST", "/auth/complete-signup", token, {
    name: "Smoke Signup",
    username: `smoke_signup_${suffix}`,
    profession: "Designer",
    about: "Test onboarding flow",
    profilePhoto: samplePhoto,
    timezone: "Asia/Kolkata",
  });

  if (completeSignup.res.status !== 200 || !completeSignup.data?.success) {
    fail("complete signup", {
      status: completeSignup.res.status,
      body: completeSignup.data,
    });
  }

  if (!completeSignup.data?.data?.isProfileComplete) {
    fail("isProfileComplete updated", completeSignup.data?.data);
  }

  pass("complete-signup endpoint");

  const tooFewInterests = await http("PATCH", "/profile/interests", token, {
    interests: ["Reading", "Music"],
  });

  if (tooFewInterests.res.status !== 400) {
    fail("reject interests < 3", {
      status: tooFewInterests.res.status,
      body: tooFewInterests.data,
    });
  }

  pass("interests min-3 validation");

  const updateInterests = await http("PATCH", "/profile/interests", token, {
    interests: ["Reading", "Music", "Fitness", "Music"],
  });

  if (updateInterests.res.status !== 200 || !updateInterests.data?.success) {
    fail("update interests", {
      status: updateInterests.res.status,
      body: updateInterests.data,
    });
  }

  const interests = updateInterests.data?.data?.interests || [];
  if (!Array.isArray(interests) || interests.length < 3) {
    fail("persist unique interests", updateInterests.data?.data);
  }

  pass("update onboarding interests");

  const noOpInterests = await http("PATCH", "/profile/interests", token, {});
  if (noOpInterests.res.status !== 200 || !noOpInterests.data?.success) {
    fail("no-op interests update", {
      status: noOpInterests.res.status,
      body: noOpInterests.data,
    });
  }

  pass("no-op interests update when already >= 3");

  const profile = await http("GET", "/profile", token);
  if (profile.res.status !== 200 || !profile.data?.success) {
    fail("fetch profile", {
      status: profile.res.status,
      body: profile.data,
    });
  }

  if (
    !Array.isArray(profile.data?.data?.interests) ||
    profile.data.data.interests.length < 3
  ) {
    fail("profile interests persisted", profile.data?.data);
  }

  pass("profile reflects onboarding interests");

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      username: true,
      profession: true,
      isProfileComplete: true,
      interests: true,
    },
  });

  if (!dbUser?.isProfileComplete || (dbUser?.interests?.length || 0) < 3) {
    fail("db persistence", dbUser);
  }

  pass("database persistence verified");
  console.log("Signup + onboarding smoke test complete: all checks passed.");

  await prisma.$disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
