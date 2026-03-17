import { LifeCircleParameter, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const taskSeed = [
  {
    title: "5-minute breath reset",
    description: "Sit quietly and breathe slowly for 5 minutes.",
    level: 1,
    parameter: LifeCircleParameter.AWARENESS,
    points: 5,
  },
  {
    title: "No-phone breakfast",
    description: "Eat one meal without using your phone.",
    level: 2,
    parameter: LifeCircleParameter.ATTENTION,
    points: 8,
  },
  {
    title: "15-minute walk",
    description: "Take a brisk walk for 15 minutes.",
    level: 2,
    parameter: LifeCircleParameter.BODY,
    points: 8,
  },
  {
    title: "Name your emotion",
    description: "Write down what you feel and why in 3 lines.",
    level: 1,
    parameter: LifeCircleParameter.EMOTIONAL,
    points: 5,
  },
  {
    title: "Meaningful check-in",
    description: "Call or text one person you care about.",
    level: 2,
    parameter: LifeCircleParameter.CONNECTION,
    points: 8,
  },
  {
    title: "Do one avoided task",
    description: "Finish one small task you have postponed.",
    level: 3,
    parameter: LifeCircleParameter.COURAGE,
    points: 12,
  },
  {
    title: "Reflective journaling",
    description: "Write 10 lines on what mattered today.",
    level: 3,
    parameter: LifeCircleParameter.MEANING,
    points: 12,
  },
  {
    title: "Cold finish shower",
    description: "Finish your shower with 30 seconds cold water.",
    level: 4,
    parameter: LifeCircleParameter.COURAGE,
    points: 15,
  },
  {
    title: "Focused deep work",
    description: "Do 30 minutes of uninterrupted work.",
    level: 4,
    parameter: LifeCircleParameter.ATTENTION,
    points: 15,
  },
  {
    title: "Digital sunset",
    description: "No social media for 2 hours before bed.",
    level: 5,
    parameter: LifeCircleParameter.AWARENESS,
    points: 20,
  },
];

async function main(): Promise<void> {
  for (const task of taskSeed) {
    await prisma.task.upsert({
      where: {
        id: `${task.parameter}-${task.level}-${task.title}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
      },
      update: {
        description: task.description,
        level: task.level,
        parameter: task.parameter,
        points: task.points,
        isActive: true,
      },
      create: {
        id: `${task.parameter}-${task.level}-${task.title}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
        title: task.title,
        description: task.description,
        level: task.level,
        parameter: task.parameter,
        points: task.points,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${taskSeed.length} tasks`);
}

main()
  .catch((error) => {
    console.error(error);
    //
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
