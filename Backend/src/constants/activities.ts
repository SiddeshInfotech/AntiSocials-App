export const CREATE_ACTIVITY_MIN_WALLET_BALANCE = 1000;

export const ACTIVITY_CATEGORIES = [
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
] as const;

export const ACTIVITY_CATEGORY_OPTIONS = [
  ...ACTIVITY_CATEGORIES,
  "OTHER",
] as const;
