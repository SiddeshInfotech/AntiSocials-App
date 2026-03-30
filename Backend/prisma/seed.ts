import { LifeCircleParameter, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const taskSeed = [
  {
    title: "Drink water every hour",
    description: "Stay hydrated by drinking water once every hour.",
    level: 1,
    parameter: LifeCircleParameter.BODY,
    points: 5,
  },
  {
    title: "No social media for one hour",
    description: "Avoid social media for one focused hour.",
    level: 1,
    parameter: LifeCircleParameter.ATTENTION,
    points: 5,
  },
  {
    title: "Breathing for 3 mins",
    description: "Take a calm breathing break for 3 minutes.",
    level: 1,
    parameter: LifeCircleParameter.AWARENESS,
    points: 5,
  },
  {
    title: "Call an old friend",
    description: "Reconnect with an old friend through a quick call.",
    level: 2,
    parameter: LifeCircleParameter.CONNECTION,
    points: 10,
  },
  {
    title: "Spend 20 minutes offline with someone",
    description: "Spend quality offline time with someone close to you.",
    level: 2,
    parameter: LifeCircleParameter.CONNECTION,
    points: 10,
  },
  {
    title: "Take a hour tech free break",
    description: "Take one complete hour away from all technology.",
    level: 3,
    parameter: LifeCircleParameter.ATTENTION,
    points: 20,
  },
  {
    title: "Meet one friend in real life",
    description: "Meet a friend in person and spend time together.",
    level: 3,
    parameter: LifeCircleParameter.CONNECTION,
    points: 20,
  },
  {
    title: "Help someone offline",
    description: "Help someone in your surroundings through real-world action.",
    level: 4,
    parameter: LifeCircleParameter.COURAGE,
    points: 35,
  },
  {
    title: "Volunteer for 1 hour",
    description:
      "Volunteer your time to support a person or cause for one hour.",
    level: 4,
    parameter: LifeCircleParameter.MEANING,
    points: 35,
  },
  {
    title: "Organise a cleanup drive",
    description: "Plan and lead a local cleanup effort.",
    level: 5,
    parameter: LifeCircleParameter.COURAGE,
    points: 50,
  },
  {
    title: "Plan one day group trip",
    description: "Plan a one-day trip with friends or family.",
    level: 5,
    parameter: LifeCircleParameter.CONNECTION,
    points: 50,
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
