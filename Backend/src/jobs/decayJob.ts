import cron from "node-cron";
import { prisma } from "../lib/prisma";

const DECAY_AFTER_DAYS = 7;
const DECAY_STEP = 2;
const SCORE_FLOOR = 0;

export function startDecayJob(): void {
  cron.schedule("0 2 * * *", async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DECAY_AFTER_DAYS);

    const scores = await prisma.lifeCircleScore.findMany({
      where: {
        lastActivityDate: {
          lt: cutoff,
        },
      },
    });

    for (const score of scores) {
      await prisma.lifeCircleScore.update({
        where: { id: score.id },
        data: {
          score: Math.max(SCORE_FLOOR, score.score - DECAY_STEP),
        },
      });
    }
  });
}
