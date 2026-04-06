const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const prisma = new PrismaClient();
const baseUrl = "http://localhost:4000";

const CATEGORIES = [
  "Sports & Fitness",
  "Music & Jamming",
  "Reading & Book Club",
  "Study Groups",
  "Tech & Coding",
  "Networking & Meetups",
  "Arts & Creativity",
  "Gaming",
  "Movies & Entertainment",
  "Food & Dining",
  "Outdoor & Adventure",
  "Travel & Trips",
  "Volunteering & Social Work",
  "Meditation & Wellness",
  "Yoga & Mindfulness",
  "Workshops & Skill Building",
  "Public Speaking & Debate",
  "Entrepreneurship & Startups",
  "Parties & Social Events",
  "Cultural & Festive Events",
];

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

  const email = `smoke_categories_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      timezone: "UTC",
      wallet: {
        create: {
          balance: 2000,
          totalEarned: 2000,
        },
      },
    },
    select: { id: true },
  });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  pass("created smoke user with sufficient wallet");

  for (const category of CATEGORIES) {
    const response = await http("POST", "/activities", token, {
      title: `Smoke Category ${Date.now()} ${category}`,
      category,
      location: "Central Park",
      maxMembers: 25,
    });

    if (response.res.status !== 201 || !response.data?.success) {
      fail(`create activity for category ${category}`, {
        status: response.res.status,
        body: response.data,
      });
    }

    if (response.data?.data?.category !== category) {
      fail(`persist category ${category}`, response.data?.data);
    }

    pass(`category accepted: ${category}`);
  }

  const customResponse = await http("POST", "/activities", token, {
    title: `Smoke Custom ${Date.now()}`,
    category: "OTHER",
    customCategory: "Campus Cleanup Circle",
    location: "Community Hall",
  });

  if (customResponse.res.status !== 201 || !customResponse.data?.success) {
    fail("create OTHER category with customCategory", {
      status: customResponse.res.status,
      body: customResponse.data,
    });
  }

  if (customResponse.data?.data?.category !== "OTHER") {
    fail("persist OTHER category", customResponse.data?.data);
  }

  if (customResponse.data?.data?.customCategory !== "Campus Cleanup Circle") {
    fail("persist customCategory", customResponse.data?.data);
  }

  pass("OTHER + customCategory accepted");

  const missingCustom = await http("POST", "/activities", token, {
    title: `Smoke Missing Custom ${Date.now()}`,
    category: "OTHER",
    location: "Community Hall",
  });

  if (
    missingCustom.res.status !== 400 ||
    missingCustom.data?.success !== false
  ) {
    fail("reject OTHER without customCategory", {
      status: missingCustom.res.status,
      body: missingCustom.data,
    });
  }

  pass("OTHER without customCategory rejected");

  const invalidCategory = await http("POST", "/activities", token, {
    title: `Smoke Invalid Category ${Date.now()}`,
    category: "Random Invalid Category",
    location: "Community Hall",
  });

  if (
    invalidCategory.res.status !== 400 ||
    invalidCategory.data?.success !== false
  ) {
    fail("reject invalid category", {
      status: invalidCategory.res.status,
      body: invalidCategory.data,
    });
  }

  pass("invalid category rejected");

  console.log("Smoke categories test complete: all checks passed.");
  await prisma.$disconnect();
  process.exit(0);
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
