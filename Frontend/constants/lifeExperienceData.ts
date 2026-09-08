/**
 * Life Experience Score — Frontend Constants
 *
 * Shared question definitions, categories, and display data
 * for the quiz screen and profile components.
 */

export interface LifeExperienceCategory {
  id: string;
  name: string;
  weight: number;
  icon: string;
  color: string;
  questionIds: string[];
}

export interface LifeExperienceQuestion {
  id: string;
  categoryId: string;
  text: string;
  options: string[];
}

export const LIFE_EXPERIENCE_CATEGORIES: LifeExperienceCategory[] = [
  {
    id: 'age_life_stage',
    name: 'Age & Life Stage',
    weight: 0.05,
    icon: '🎂',
    color: '#8B5CF6',
    questionIds: ['Q01', 'Q02', 'Q03'],
  },
  {
    id: 'travel_exploration',
    name: 'Travel & Exploration',
    weight: 0.10,
    icon: '✈️',
    color: '#3B82F6',
    questionIds: ['Q04', 'Q05', 'Q06'],
  },
  {
    id: 'adventure_new_experiences',
    name: 'Adventure & New Experiences',
    weight: 0.10,
    icon: '🏔️',
    color: '#EF4444',
    questionIds: ['Q07', 'Q08', 'Q09'],
  },
  {
    id: 'education_learning',
    name: 'Education & Learning',
    weight: 0.10,
    icon: '📚',
    color: '#F59E0B',
    questionIds: ['Q10', 'Q11', 'Q12'],
  },
  {
    id: 'relationships_family',
    name: 'Relationships & Family',
    weight: 0.15,
    icon: '❤️',
    color: '#EC4899',
    questionIds: ['Q13', 'Q14', 'Q15'],
  },
  {
    id: 'community_contribution',
    name: 'Community & Contribution',
    weight: 0.15,
    icon: '🤝',
    color: '#10B981',
    questionIds: ['Q16', 'Q17', 'Q18'],
  },
  {
    id: 'health_fitness_physical',
    name: 'Health & Fitness',
    weight: 0.10,
    icon: '💪',
    color: '#14B8A6',
    questionIds: ['Q19', 'Q20', 'Q21'],
  },
  {
    id: 'creativity_hobbies_passion',
    name: 'Creativity & Hobbies',
    weight: 0.10,
    icon: '🎨',
    color: '#F97316',
    questionIds: ['Q22', 'Q23', 'Q24'],
  },
  {
    id: 'culture_social_experiences',
    name: 'Culture & Social',
    weight: 0.05,
    icon: '🎭',
    color: '#6366F1',
    questionIds: ['Q25', 'Q26', 'Q27'],
  },
  {
    id: 'personal_growth_courage',
    name: 'Growth & Courage',
    weight: 0.10,
    icon: '🦁',
    color: '#D946EF',
    questionIds: ['Q28', 'Q29', 'Q30'],
  },
];

export const LIFE_EXPERIENCE_QUESTIONS: LifeExperienceQuestion[] = [
  // Category 1 — Age & Life Stage
  {
    id: 'Q01',
    categoryId: 'age_life_stage',
    text: 'What is your age?',
    options: ['18–24', '25–29', '30–39', '40+'],
  },
  {
    id: 'Q02',
    categoryId: 'age_life_stage',
    text: 'How independently have you lived?',
    options: [
      'Mostly with family',
      'Some independent periods',
      'Mostly independent',
      'Independent for many years',
    ],
  },
  {
    id: 'Q03',
    categoryId: 'age_life_stage',
    text: 'How much major life responsibility have you experienced?',
    options: [
      'Very little',
      'Some responsibility',
      'Significant responsibility',
      'Multiple major responsibilities',
    ],
  },

  // Category 2 — Travel & Exploration
  {
    id: 'Q04',
    categoryId: 'travel_exploration',
    text: 'How many countries have you visited?',
    options: ['0', '1–3', '4–10', '11+'],
  },
  {
    id: 'Q05',
    categoryId: 'travel_exploration',
    text: 'How much of India have you explored?',
    options: ['0–2 states/UTs', '3–7 states/UTs', '8–15 states/UTs', '16+ states/UTs'],
  },
  {
    id: 'Q06',
    categoryId: 'travel_exploration',
    text: 'How deeply have you experienced the places you visited?',
    options: [
      'Mostly short/local trips',
      'Some longer trips',
      'Several immersive trips',
      'Many immersive/cultural trips',
    ],
  },

  // Category 3 — Adventure & New Experiences
  {
    id: 'Q07',
    categoryId: 'adventure_new_experiences',
    text: 'How many different adventure or outdoor activities have you tried?',
    options: ['0', '1–2', '3–5', '6+'],
  },
  {
    id: 'Q08',
    categoryId: 'adventure_new_experiences',
    text: 'How often have you deliberately tried something outside your comfort zone?',
    options: ['Rarely', 'Occasionally', 'Often', 'Very often'],
  },
  {
    id: 'Q09',
    categoryId: 'adventure_new_experiences',
    text: 'What is your highest level of major adventure experience?',
    options: [
      'None',
      'Trek, camping or major road trip',
      'Rafting, scuba diving or paragliding',
      'Skydiving, expedition or equivalent',
    ],
  },

  // Category 4 — Education & Learning
  {
    id: 'Q10',
    categoryId: 'education_learning',
    text: 'What is your highest completed formal education?',
    options: [
      'Secondary school',
      "Diploma/Bachelor's",
      "Master's/professional qualification",
      'Doctorate/advanced qualification',
    ],
  },
  {
    id: 'Q11',
    categoryId: 'education_learning',
    text: 'How many meaningful skills have you learned outside formal education?',
    options: ['0', '1–2', '3–5', '6+'],
  },
  {
    id: 'Q12',
    categoryId: 'education_learning',
    text: 'How actively do you continue learning?',
    options: [
      'Rarely',
      'Occasionally',
      'Regularly',
      'Continuously through courses, books, mentors or practice',
    ],
  },

  // Category 5 — Relationships & Family
  {
    id: 'Q13',
    categoryId: 'relationships_family',
    text: 'How strong is your meaningful friendship network?',
    options: [
      'Very limited',
      'A few close friends',
      'Several strong relationships',
      'Deep, long-term network',
    ],
  },
  {
    id: 'Q14',
    categoryId: 'relationships_family',
    text: 'Which best describes your relationship and family experience?',
    options: [
      'Limited experience',
      'Long-term relationship or family involvement',
      'Marriage, long-term commitment or equivalent responsibility',
      'Major family, caregiving or parenting responsibility',
    ],
  },
  {
    id: 'Q15',
    categoryId: 'relationships_family',
    text: 'How much responsibility have you taken for people close to you?',
    options: ['Very little', 'Some', 'Significant', 'Major ongoing responsibility'],
  },

  // Category 6 — Community & Contribution
  {
    id: 'Q16',
    categoryId: 'community_contribution',
    text: 'How much have you volunteered or helped in your community?',
    options: [
      'Never',
      'Once or a few times',
      'Regularly',
      'Long-term or consistent contribution',
    ],
  },
  {
    id: 'Q17',
    categoryId: 'community_contribution',
    text: 'Have you organised or led a community activity?',
    options: [
      'Never',
      'Helped occasionally',
      'Helped organise',
      'Led or organised multiple activities',
    ],
  },
  {
    id: 'Q18',
    categoryId: 'community_contribution',
    text: 'How often have you meaningfully helped someone outside your immediate family?',
    options: ['Rarely', 'Occasionally', 'Often', 'Consistently'],
  },

  // Category 7 — Health, Fitness & Physical Life
  {
    id: 'Q19',
    categoryId: 'health_fitness_physical',
    text: 'How broad is your physical activity experience?',
    options: [
      'Little or none',
      'One activity',
      'Several activities',
      'Multiple sports or activities',
    ],
  },
  {
    id: 'Q20',
    categoryId: 'health_fitness_physical',
    text: 'Have you completed a meaningful physical challenge?',
    options: ['No', 'Small challenge', 'Major challenge or event', 'Multiple major challenges'],
  },
  {
    id: 'Q21',
    categoryId: 'health_fitness_physical',
    text: 'How consistently have you participated in physical activity?',
    options: [
      'Rarely',
      'Occasionally',
      'Regularly',
      'Long-term consistent practice',
    ],
  },

  // Category 8 — Creativity, Hobbies & Passion
  {
    id: 'Q22',
    categoryId: 'creativity_hobbies_passion',
    text: 'How many hobbies have you seriously explored?',
    options: ['0', '1', '2–3', '4+'],
  },
  {
    id: 'Q23',
    categoryId: 'creativity_hobbies_passion',
    text: 'How many creative skills have you developed?',
    options: ['0', '1', '2–3', '4+'],
  },
  {
    id: 'Q24',
    categoryId: 'creativity_hobbies_passion',
    text: 'How much time have you invested in passions outside work or study?',
    options: [
      'Very little',
      'Some',
      'Regularly',
      'Deep long-term involvement',
    ],
  },

  // Category 9 — Culture & Social Experiences
  {
    id: 'Q25',
    categoryId: 'culture_social_experiences',
    text: 'How many different cultural or social experiences have you actively explored?',
    options: ['Very few', 'Some', 'Many', 'Very many and diverse'],
  },
  {
    id: 'Q26',
    categoryId: 'culture_social_experiences',
    text: 'How often have you attended concerts, theatre, festivals, exhibitions or sports events?',
    options: [
      'Rarely',
      'Occasionally',
      'Regularly',
      'Frequently across different types',
    ],
  },
  {
    id: 'Q27',
    categoryId: 'culture_social_experiences',
    text: 'How much have you explored different cuisines, traditions or communities?',
    options: ['Very little', 'Some', 'A lot', 'Extensively'],
  },

  // Category 10 — Personal Growth & Courage
  {
    id: 'Q28',
    categoryId: 'personal_growth_courage',
    text: 'How many major changes have you voluntarily taken in life?',
    options: ['0', '1', '2–3', '4+'],
  },
  {
    id: 'Q29',
    categoryId: 'personal_growth_courage',
    text: 'How often have you deliberately faced a significant fear or challenge?',
    options: ['Rarely', 'Occasionally', 'Often', 'Repeatedly'],
  },
  {
    id: 'Q30',
    categoryId: 'personal_growth_courage',
    text: 'How much have you stepped outside your familiar environment?',
    options: [
      'Very little',
      'Sometimes',
      'Often',
      'Consistently sought new experiences',
    ],
  },
];

/**
 * Get the category object by its slug/id.
 */
export function getCategoryById(categoryId: string): LifeExperienceCategory | undefined {
  return LIFE_EXPERIENCE_CATEGORIES.find(c => c.id === categoryId);
}

/**
 * Get all questions for a given category.
 */
export function getQuestionsByCategory(categoryId: string): LifeExperienceQuestion[] {
  return LIFE_EXPERIENCE_QUESTIONS.filter(q => q.categoryId === categoryId);
}

/**
 * Connector / Life Living Rank Level Configuration
 *
 * Level 1: Score 0–59 -> Level 1
 * Level 2: Score 60–100 -> Level 2
 *
 * Note: Levels 3, 4, 5 rules are not decided yet.
 * Structure is extensible for future levels.
 */
export interface ConnectorThreshold {
  level: number;
  min: number;
  max: number;
  label: string;
}

export const CONNECTOR_LEVEL_THRESHOLDS: ConnectorThreshold[] = [
  { level: 1, min: 0, max: 59, label: 'Lvl 1' },
  { level: 2, min: 60, max: 100, label: 'Lvl 2' },
];

export interface ConnectorLevelDetails {
  level: number;
  levelLabel: string;
  progressPercent: number;
  nextLevelLabel: string;
  rank: string;
  description: string;
}

/**
 * Determine Connector Level from Total Life Experience Score.
 * @param score - Overall score 0-100
 * @returns Level number (1 or 2)
 */
export function calculateConnectorLevel(score: number): number {
  const num = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  for (const t of CONNECTOR_LEVEL_THRESHOLDS) {
    if (num >= t.min && num <= t.max) {
      return t.level;
    }
  }
  return CONNECTOR_LEVEL_THRESHOLDS[CONNECTOR_LEVEL_THRESHOLDS.length - 1].level;
}

/**
 * Get detailed Connector level information including progress percentage and next level label.
 * @param score - Overall score 0-100
 * @returns ConnectorLevelDetails
 */
export function getConnectorLevelDetails(score: number): ConnectorLevelDetails {
  const num = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const level = calculateConnectorLevel(num);

  const currentThreshold =
    CONNECTOR_LEVEL_THRESHOLDS.find(t => t.level === level) || CONNECTOR_LEVEL_THRESHOLDS[0];
  const range = currentThreshold.max - currentThreshold.min + 1;
  const progressPercent = Math.min(100, Math.max(0, Math.round(((num - currentThreshold.min) / range) * 100)));

  const currentIndex = CONNECTOR_LEVEL_THRESHOLDS.findIndex(t => t.level === level);
  const isLast = currentIndex === CONNECTOR_LEVEL_THRESHOLDS.length - 1;
  const nextLevelLabel = isLast
    ? 'Level 3 · Coming soon'
    : `Level ${CONNECTOR_LEVEL_THRESHOLDS[currentIndex + 1].level} · Score ${CONNECTOR_LEVEL_THRESHOLDS[currentIndex + 1].min}+`;

  return {
    level,
    levelLabel: `Lvl ${level}`,
    progressPercent,
    nextLevelLabel,
    rank: 'Connector',
    description: 'Real relationships',
  };
}
