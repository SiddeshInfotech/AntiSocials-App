import {
  LifeCircleParameter,
  PrismaClient,
  TaskDifficulty,
} from "@prisma/client";

const prisma = new PrismaClient();

const taskSeed = [
  {
    title: "Drink water every hour",
    description: "Stay hydrated by drinking water once every hour.",
    level: 1,
    difficulty: TaskDifficulty.EASY,
    parameter: LifeCircleParameter.BODY,
    points: 5,
  },
  {
    title: "No social media for one hour",
    description: "Avoid social media for one focused hour.",
    level: 1,
    difficulty: TaskDifficulty.EASY,
    parameter: LifeCircleParameter.ATTENTION,
    points: 5,
  },
  {
    title: "Breathing for 3 mins",
    description: "Take a calm breathing break for 3 minutes.",
    level: 1,
    difficulty: TaskDifficulty.EASY,
    parameter: LifeCircleParameter.AWARENESS,
    points: 5,
  },
  {
    title: "Call an old friend",
    description: "Reconnect with an old friend through a quick call.",
    level: 2,
    difficulty: TaskDifficulty.EASY,
    parameter: LifeCircleParameter.CONNECTION,
    points: 10,
  },
  {
    title: "Spend 20 minutes offline with someone",
    description: "Spend quality offline time with someone close to you.",
    level: 2,
    difficulty: TaskDifficulty.EASY,
    parameter: LifeCircleParameter.CONNECTION,
    points: 10,
  },
  {
    title: "Take a hour tech free break",
    description: "Take one complete hour away from all technology.",
    level: 3,
    difficulty: TaskDifficulty.MEDIUM,
    parameter: LifeCircleParameter.ATTENTION,
    points: 20,
  },
  {
    title: "Meet one friend in real life",
    description: "Meet a friend in person and spend time together.",
    level: 3,
    difficulty: TaskDifficulty.MEDIUM,
    parameter: LifeCircleParameter.CONNECTION,
    points: 20,
  },
  {
    title: "Help someone offline",
    description: "Help someone in your surroundings through real-world action.",
    level: 4,
    difficulty: TaskDifficulty.HARD,
    parameter: LifeCircleParameter.COURAGE,
    points: 35,
  },
  {
    title: "Volunteer for 1 hour",
    description:
      "Volunteer your time to support a person or cause for one hour.",
    level: 4,
    difficulty: TaskDifficulty.HARD,
    parameter: LifeCircleParameter.MEANING,
    points: 35,
  },
  {
    title: "Organise a cleanup drive",
    description: "Plan and lead a local cleanup effort.",
    level: 5,
    difficulty: TaskDifficulty.HARD,
    parameter: LifeCircleParameter.COURAGE,
    points: 50,
  },
  {
    title: "Plan one day group trip",
    description: "Plan a one-day trip with friends or family.",
    level: 5,
    difficulty: TaskDifficulty.HARD,
    parameter: LifeCircleParameter.CONNECTION,
    points: 50,
  },
];

const volunteerSubtasks = [
  {
    title: "Older People",
    description: "Help and support for elderly individuals",
    icon: "👴",
  },
  {
    title: "Community",
    description: "Community development and support",
    icon: "🤝",
  },
  {
    title: "Crisis and Welfare",
    description: "Crisis support and welfare services",
    icon: "🙏",
  },
  {
    title: "Animal Welfare",
    description: "Care and support for animals",
    icon: "🐕",
  },
  {
    title: "Sport, Art and Culture",
    description: "Sports, arts, and cultural initiatives",
    icon: "🎨",
  },
  {
    title: "Young People and Children",
    description: "Support for youth and children",
    icon: "👶",
  },
  {
    title: "Health and Social Care",
    description: "Healthcare and social services",
    icon: "❤️",
  },
  {
    title: "Sustainability, Heritage and Environment",
    description: "Environmental and heritage conservation",
    icon: "🌍",
  },
];

async function main(): Promise<void> {
  for (const task of taskSeed) {
    const isVolunteerTask = task.title === "Volunteer for 1 hour";

    await prisma.task.upsert({
      where: {
        id: `${task.parameter}-${task.level}-${task.title}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
      },
      update: {
        description: task.description,
        level: task.level,
        difficulty: task.difficulty,
        parameter: task.parameter,
        points: task.points,
        requiresSubtask: isVolunteerTask,
        requiresPhotoVerification: isVolunteerTask,
        isActive: true,
      },
      create: {
        id: `${task.parameter}-${task.level}-${task.title}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-"),
        title: task.title,
        description: task.description,
        level: task.level,
        difficulty: task.difficulty,
        parameter: task.parameter,
        points: task.points,
        requiresSubtask: isVolunteerTask,
        requiresPhotoVerification: isVolunteerTask,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${taskSeed.length} tasks`);

  // Seed subtasks for Volunteer task
  const volunteerTask = await prisma.task.findUnique({
    where: {
      id: "meaning-4-volunteer-for-1-hour",
    },
  });

  if (volunteerTask) {
    for (const subtask of volunteerSubtasks) {
      await prisma.subtask.upsert({
        where: {
          id: `${volunteerTask.id}-${subtask.title}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
        },
        update: {
          title: subtask.title,
          description: subtask.description,
          icon: subtask.icon,
          isActive: true,
        },
        create: {
          id: `${volunteerTask.id}-${subtask.title}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
          taskId: volunteerTask.id,
          title: subtask.title,
          description: subtask.description,
          icon: subtask.icon,
          isActive: true,
        },
      });
    }
    console.log(
      `Seeded ${volunteerSubtasks.length} subtasks for Volunteer task`,
    );
  } else {
    console.warn(
      "Volunteer task not found. Skipping subtasks seeding. Make sure the Volunteer task exists.",
    );
  }
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
