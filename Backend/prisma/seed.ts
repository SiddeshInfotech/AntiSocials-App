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
  // AWARENESS
  {
    title: "Morning intention",
    description: "Write one clear intention for the day ahead.",
    level: 2,
    parameter: LifeCircleParameter.AWARENESS,
    points: 8,
  },
  {
    title: "Mindful observation",
    description: "Spend 10 minutes observing your surroundings without judgment.",
    level: 3,
    parameter: LifeCircleParameter.AWARENESS,
    points: 12,
  },

  // ATTENTION
  {
    title: "Single-task for 1 hour",
    description: "Work on only one thing for a full hour, no switching.",
    level: 3,
    parameter: LifeCircleParameter.ATTENTION,
    points: 12,
  },
  {
    title: "Read for 20 minutes",
    description: "Read a book or article without any distractions.",
    level: 2,
    parameter: LifeCircleParameter.ATTENTION,
    points: 8,
  },

  // BODY
  {
    title: "10-minute stretch",
    description: "Do a full body stretching routine for 10 minutes.",
    level: 1,
    parameter: LifeCircleParameter.BODY,
    points: 5,
  },
  {
    title: "Drink 8 glasses of water",
    description: "Track and complete your daily water intake goal.",
    level: 1,
    parameter: LifeCircleParameter.BODY,
    points: 5,
  },

  // EMOTIONAL
  {
    title: "Gratitude list",
    description: "Write down 5 things you are genuinely grateful for today.",
    level: 2,
    parameter: LifeCircleParameter.EMOTIONAL,
    points: 8,
  },
  {
    title: "Forgiveness note",
    description: "Write a short note forgiving yourself for one mistake.",
    level: 3,
    parameter: LifeCircleParameter.EMOTIONAL,
    points: 12,
  },

  // CONNECTION
  {
    title: "Active listening",
    description: "Have a conversation where you only listen, no advice.",
    level: 3,
    parameter: LifeCircleParameter.CONNECTION,
    points: 12,
  },
  {
    title: "Express appreciation",
    description: "Tell someone specifically what you appreciate about them.",
    level: 2,
    parameter: LifeCircleParameter.CONNECTION,
    points: 8,
  },

  // COURAGE
  {
    title: "Share your opinion",
    description: "Speak up and share your honest opinion in a conversation.",
    level: 2,
    parameter: LifeCircleParameter.COURAGE,
    points: 8,
  },
  {
    title: "Try something new",
    description: "Do one thing today you have never done before.",
    level: 3,
    parameter: LifeCircleParameter.COURAGE,
    points: 12,
  },

  // MEANING
  {
    title: "Define your why",
    description: "Write one paragraph about why your current goal matters.",
    level: 2,
    parameter: LifeCircleParameter.MEANING,
    points: 8,
  },
  {
    title: "Review your values",
    description: "List your top 3 personal values and rate how well you lived them today.",
    level: 4,
    parameter: LifeCircleParameter.MEANING,
    points: 15,
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
