import { app } from "./app";
import { env } from "./config/env";
import { startDecayJob } from "./jobs/decayJob";
import { prisma } from "./lib/prisma";

// Wake up Neon immediately on start
async function wakeUpDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected successfully");
  } catch (e) {
    console.error("Database connection failed:", e);
  }
}

// Keep Neon awake every 4 minutes
setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Keep-alive ping sent");
  } catch (e) {
    console.error("Keep-alive failed:", e);
  }
}, 4 * 60 * 1000);

app.listen(env.PORT, async () => {
  await wakeUpDatabase();
  startDecayJob();
  console.log(`AntiSocials backend running on port ${env.PORT}`);
});