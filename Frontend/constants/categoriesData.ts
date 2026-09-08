export interface MainCategory {
  id: string;
  name: string;
  subcategories: string[];
}

export const CATEGORIES_DATA: MainCategory[] = [
  {
    id: "1",
    name: "Achievements",
    subcategories: [
      "Academic Wins", "Career Wins", "Sports Wins", "Fitness Milestones",
      "Project Completion", "Competition Wins", "Certifications", "First-Time Achievements",
      "Personal Records", "Financial Milestones", "Creative Achievements", "Skill Milestones",
      "Habit Streaks", "Goal Completion", "Overcoming Fear", "Major Life Milestones",
      "Team Achievements", "Community Impact", "Comeback Stories", "Milestone Unlocked"
    ]
  },
  {
    id: "2",
    name: "Advice",
    subcategories: [
      "Career Advice", "Study Advice", "Fitness Advice", "Money Advice",
      "Relationship Advice", "Travel Advice", "Food Advice", "Productivity Advice",
      "College Advice", "Coding Advice", "Business Advice", "Communication Advice",
      "Confidence Advice", "Decision Making", "Time Management", "Health Habits",
      "Social Skills", "Problem Solving", "Life Decisions", "Beginner Guidance"
    ]
  },
  {
    id: "3",
    name: "Adventures",
    subcategories: [
      "Skydiving", "Scuba Diving", "Paragliding", "Bungee Jumping",
      "Rock Climbing", "Whitewater Rafting", "Ziplining", "Trekking",
      "Mountain Climbing", "Caving", "Surfing", "Kayaking",
      "Snowboarding", "Skiing", "Safari", "Jungle Trek",
      "Desert Safari", "Hot Air Balloon", "Motorcycle Trip", "Long-Distance Road Trip"
    ]
  },
  {
    id: "4",
    name: "Animals",
    subcategories: [
      "Dogs", "Cats", "Birds", "Fish", "Horses", "Rabbits", "Hamsters", "Guinea Pigs",
      "Reptiles", "Turtles", "Snakes", "Butterflies", "Bees", "Dolphins", "Whales",
      "Elephants", "Tigers", "Lions", "Pandas", "Wildlife"
    ]
  },
  {
    id: "5",
    name: "Anime",
    subcategories: [
      "Action Anime", "Adventure Anime", "Comedy Anime", "Romance Anime",
      "Fantasy Anime", "Isekai Anime", "Sports Anime", "School Anime",
      "Slice of Life", "Mecha Anime", "Mystery Anime", "Horror Anime",
      "Psychological Anime", "Shonen Anime", "Shojo Anime", "Seinen Anime",
      "Josei Anime", "Anime Movies", "Anime Characters", "Anime Recommendations"
    ]
  },
  {
    id: "6",
    name: "Architecture",
    subcategories: [
      "Residential Architecture", "Commercial Buildings", "Skyscrapers", "Brutalist Architecture",
      "Gothic Architecture", "Modern Architecture", "Minimalist Architecture", "Traditional Architecture",
      "Japanese Architecture", "Islamic Architecture", "Indian Architecture", "Roman Architecture",
      "Greek Architecture", "Sustainable Architecture", "Interior Architecture", "Landscape Architecture",
      "Urban Design", "Historic Buildings", "Famous Structures", "Architectural Details"
    ]
  },
  {
    id: "7",
    name: "Art",
    subcategories: [
      "Oil Painting", "Watercolor", "Acrylic Painting", "Sketching",
      "Pencil Drawing", "Charcoal Drawing", "Digital Art", "Portrait Art",
      "Landscape Art", "Abstract Art", "Calligraphy", "Typography Art",
      "Sculpture", "Clay Art", "Origami", "Paper Art",
      "Collage", "Street Art", "Graffiti", "Art Journaling"
    ]
  },
  {
    id: "8",
    name: "Astronomy",
    subcategories: [
      "Moon", "Sun", "Planets", "Stars", "Constellations", "Galaxies", "Nebulae", "Black Holes",
      "Comets", "Asteroids", "Meteors", "Eclipses", "Aurora", "Space Missions", "Space Telescopes",
      "Exoplanets", "Milky Way", "Cosmology", "Astronauts", "Stargazing"
    ]
  },
  {
    id: "9",
    name: "Automotive",
    subcategories: [
      "Sedans", "SUVs", "Hatchbacks", "Sports Cars", "Supercars", "Hypercars", "Electric Cars",
      "Hybrid Cars", "Classic Cars", "Muscle Cars", "Luxury Cars", "Pickup Trucks",
      "Off-Road Vehicles", "Rally Cars", "Race Cars", "Car Modifications", "Car Detailing",
      "Car Photography", "Car Meets", "Driving"
    ]
  },
  {
    id: "10",
    name: "Sports",
    subcategories: [
      "Cricket", "Basketball", "Badminton", "Football", "Soccer", "Tennis", "Volleyball",
      "Swimming", "Running", "Cycling", "Boxing", "Wrestling", "MMA", "Table Tennis",
      "Hockey", "Golf", "Baseball", "Archery", "Skateboarding", "Athletics"
    ]
  },
  {
    id: "11",
    name: "Books",
    subcategories: [
      "Fiction", "Non-Fiction", "Mystery", "Thriller", "Romance", "Fantasy", "Science Fiction",
      "Biography", "Autobiography", "Self-Help", "Psychology", "Business Books", "Finance Books",
      "History Books", "Science Books", "Philosophy", "Poetry", "Comics", "Manga", "Graphic Novels"
    ]
  },
  {
    id: "12",
    name: "Business",
    subcategories: [
      "Business Ideas", "Small Business", "E-Commerce", "Retail", "Marketing", "Sales",
      "Operations", "Management", "Customer Service", "Business Strategy", "Branding",
      "Business Analytics", "Franchising", "Family Business", "B2B", "B2C", "Local Business",
      "Online Business", "Business Case Studies", "Business News"
    ]
  },
  {
    id: "13",
    name: "Career",
    subcategories: [
      "Programming", "Software Development", "UI/UX Design", "Data Science", "Cybersecurity",
      "Digital Marketing", "Sales", "Finance", "Accounting", "Human Resources", "Project Management",
      "Product Management", "Business Analysis", "Consulting", "Content Creation", "Graphic Design",
      "Video Editing", "Teaching", "Healthcare", "Freelancing"
    ]
  },
  {
    id: "14",
    name: "College Life",
    subcategories: [
      "College Classes", "Campus Life", "College Friends", "College Clubs", "College Festivals",
      "College Events", "College Projects", "College Assignments", "College Exams", "Hostel Life",
      "College Sports", "College Canteen", "College Trips", "College Memories", "Freshers",
      "Graduation", "Student Communities", "Internships", "College Competitions", "Student Life"
    ]
  },
  {
    id: "15",
    name: "Comedy",
    subcategories: [
      "Stand-Up Comedy", "Sketch Comedy", "Situational Comedy", "Dark Comedy", "Observational Comedy",
      "Satire", "Parody", "Pranks", "Funny Stories", "Funny Videos", "Funny Photos", "One-Liners",
      "Dad Jokes", "Roasts", "Impressions", "Comedy Shows", "Comedy Movies", "Comedy Reactions",
      "Funny Fails", "Everyday Humor"
    ]
  },
  {
    id: "16",
    name: "Community",
    subcategories: [
      "Local Communities", "Student Communities", "Developer Communities", "Sports Communities",
      "Fitness Communities", "Creator Communities", "Book Communities", "Gaming Communities",
      "Travel Communities", "Volunteer Groups", "Meetups", "Clubs", "Online Communities",
      "Neighborhoods", "Community Projects", "Fundraisers", "Social Causes", "Support Groups",
      "Community Events", "Community Stories"
    ]
  },
  {
    id: "17",
    name: "Cooking",
    subcategories: [
      "Breakfast", "Lunch", "Dinner", "Snacks", "Soups", "Salads", "Grilling", "Baking",
      "Roasting", "Frying", "Air Fryer", "Meal Prep", "Sauces", "Pasta Making", "Bread Making",
      "Pizza Making", "Dessert Making", "Fermentation", "Pickling", "Plating"
    ]
  },
  {
    id: "18",
    name: "Food",
    subcategories: [
      "Noodles", "Sushi", "Ramen", "Pizza", "Burger", "Tacos", "Burritos", "Sandwiches",
      "Wraps", "Dumplings", "Fried Rice", "Biryani", "Curry", "Steak", "BBQ", "Fried Chicken",
      "Salads", "Soups", "Cheesecake", "Ice Cream"
    ]
  },
  {
    id: "19",
    name: "Cricket",
    subcategories: [
      "Test Cricket", "ODI Cricket", "T20 Cricket", "IPL", "International Cricket",
      "Domestic Cricket", "Club Cricket", "Street Cricket", "Batting", "Bowling",
      "Fielding", "Wicketkeeping", "Cricket Training", "Cricket Gear", "Cricket Grounds",
      "Cricket Records", "Cricket Tournaments", "Match Highlights", "Cricket Fans", "Cricket News"
    ]
  },
  {
    id: "20",
    name: "Basketball",
    subcategories: [
      "NBA", "WNBA", "College Basketball", "Street Basketball", "3x3 Basketball",
      "International Basketball", "Basketball Training", "Dribbling", "Shooting", "Dunking",
      "Defense", "Rebounding", "Basketball Fitness", "Basketball Gear", "Basketball Courts",
      "Basketball Tournaments", "Basketball Highlights", "Basketball Records", "Basketball Players", "Basketball News"
    ]
  },
  {
    id: "21",
    name: "Badminton",
    subcategories: [
      "Singles", "Doubles", "Mixed Doubles", "Professional Badminton", "Club Badminton",
      "School Badminton", "Badminton Training", "Smash", "Drop Shot", "Clear Shot",
      "Net Play", "Footwork", "Badminton Fitness", "Badminton Rackets", "Badminton Shoes",
      "Badminton Courts", "Badminton Tournaments", "Match Highlights", "Badminton Players", "Badminton News"
    ]
  },
  {
    id: "22",
    name: "Fitness",
    subcategories: [
      "Weightlifting", "Powerlifting", "Bodybuilding", "Calisthenics", "CrossFit", "HIIT",
      "Cardio", "Cycling", "Running", "Swimming", "Yoga", "Pilates", "Boxing", "Kickboxing",
      "Martial Arts", "Mobility Training", "Flexibility Training", "Core Training", "Functional Training", "Sports Conditioning"
    ]
  },
  {
    id: "23",
    name: "Exercise",
    subcategories: [
      "Push-Ups", "Pull-Ups", "Squats", "Lunges", "Plank", "Burpees", "Jump Rope", "Running",
      "Cycling", "Swimming", "Walking", "Stretching", "Yoga", "HIIT", "Weight Training",
      "Core Workout", "Leg Workout", "Arm Workout", "Full Body Workout", "Mobility"
    ]
  },
  {
    id: "24",
    name: "Fashion",
    subcategories: [
      "Casual Wear", "Formal Wear", "Streetwear", "Athleisure", "Party Wear", "Traditional Wear",
      "Office Wear", "Summer Wear", "Winter Wear", "Denim", "T-Shirts", "Shirts", "Jackets",
      "Dresses", "Suits", "Ethnic Wear", "Accessories", "Watches", "Bags", "Footwear"
    ]
  },
  {
    id: "25",
    name: "Finance",
    subcategories: [
      "Budgeting", "Saving", "Investing", "Stocks", "Mutual Funds", "ETFs", "Bonds", "Retirement",
      "Taxes", "Credit Cards", "Loans", "Insurance", "Emergency Fund", "Expense Tracking",
      "Passive Income", "Side Income", "Real Estate", "Cryptocurrency", "Financial Planning", "Money Management"
    ]
  },
  {
    id: "26",
    name: "Gaming",
    subcategories: [
      "Action Games", "RPG", "FPS", "Racing Games", "Sports Games", "Strategy Games",
      "Simulation Games", "Survival Games", "Horror Games", "Puzzle Games", "Open World",
      "Battle Royale", "MOBA", "Fighting Games", "Platformers", "Indie Games", "Co-op Games",
      "Mobile Games", "PC Games", "Console Games"
    ]
  },
  {
    id: "27",
    name: "Travel",
    subcategories: [
      "City Trips", "Beach Trips", "Mountain Trips", "Forest Trips", "Desert Trips", "Island Trips",
      "Road Trips", "Train Trips", "Backpacking", "Solo Travel", "Family Trips", "Luxury Travel",
      "Budget Travel", "Adventure Travel", "Food Trips", "Wildlife Trips", "Cultural Trips",
      "Weekend Getaways", "Hidden Places", "International Trips"
    ]
  },
  {
    id: "28",
    name: "Technology",
    subcategories: [
      "Smartphones", "Laptops", "Tablets", "Smartwatches", "Wireless Earbuds", "Gaming Consoles",
      "Cameras", "Drones", "Smart TVs", "VR Headsets", "AI", "Robotics", "3D Printers",
      "Smart Home", "Wearables", "Electric Vehicles", "Cloud Computing", "Blockchain", "AR/VR", "Internet of Things"
    ]
  },
  {
    id: "29",
    name: "Programming",
    subcategories: [
      "HTML", "CSS", "JavaScript", "TypeScript", "Python", "Java", "C", "C++", "C#", "Go", "Rust",
      "PHP", "Swift", "Kotlin", "React", "React Native", "Node.js", "Django", "Flutter", "SQL"
    ]
  },
  {
    id: "30",
    name: "Art & Design",
    subcategories: [
      "Graphic Design", "UI Design", "UX Design", "Logo Design", "Branding", "Web Design",
      "Mobile Design", "Typography", "Illustration", "Motion Design", "3D Design", "Packaging Design",
      "Poster Design", "Presentation Design", "Design Systems", "Wireframes", "Prototypes",
      "Design Research", "Digital Illustration", "Visual Identity"
    ]
  },
  {
    id: "31",
    name: "Music",
    subcategories: [
      "Pop", "Rock", "Hip Hop", "Rap", "R&B", "Jazz", "Blues", "Classical", "Electronic", "EDM",
      "Indie", "Lo-fi", "Metal", "Punk", "Reggae", "Country", "K-Pop", "Bollywood Music",
      "Instrumental", "Live Music"
    ]
  },
  {
    id: "32",
    name: "Movies",
    subcategories: [
      "Action", "Comedy", "Drama", "Thriller", "Horror", "Romance", "Sci-Fi", "Fantasy",
      "Animation", "Documentary", "Mystery", "Crime", "Adventure", "Biography", "Historical",
      "Superhero", "Psychological", "Indie Films", "Short Films", "Movie Classics"
    ]
  },
  {
    id: "33",
    name: "Photography",
    subcategories: [
      "Portraits", "Street Photography", "Landscape Photography", "Wildlife Photography",
      "Food Photography", "Product Photography", "Travel Photography", "Astrophotography",
      "Sports Photography", "Architecture Photography", "Macro Photography", "Night Photography",
      "Long Exposure", "Black & White", "Mobile Photography", "Film Photography", "Event Photography",
      "Wedding Photography", "Drone Photography", "Self Portraits"
    ]
  },
  {
    id: "34",
    name: "Nature",
    subcategories: [
      "Forests", "Mountains", "Rivers", "Lakes", "Beaches", "Waterfalls", "Deserts", "Islands",
      "Wildlife", "Birdwatching", "Sunsets", "Sunrises", "Flowers", "Trees", "Gardens",
      "National Parks", "Hiking Trails", "Weather", "Seasons", "Stargazing"
    ]
  },
  {
    id: "35",
    name: "Habits",
    subcategories: [
      "Morning Routine", "Night Routine", "Reading", "Exercise", "Hydration", "Healthy Eating",
      "Meditation", "Early Wake-Up", "Sleep Schedule", "Journaling", "Deep Work", "Study Routine",
      "Workout Routine", "Digital Detox", "Decluttering", "Saving Money", "Gratitude", "Walking",
      "Learning", "Habit Streaks"
    ]
  },
  {
    id: "36",
    name: "Productivity",
    subcategories: [
      "Deep Work", "Time Blocking", "Pomodoro", "Task Lists", "Priority Setting", "Focus Sessions",
      "Weekly Planning", "Daily Planning", "Calendar Blocking", "Note Taking", "Inbox Zero",
      "Workspace Setup", "Distraction Blocking", "Automation", "Routine Building", "Goal Tracking",
      "Project Planning", "Meeting Management", "Energy Management", "Procrastination Control"
    ]
  },
  {
    id: "37",
    name: "Self Improvement",
    subcategories: [
      "Confidence", "Discipline", "Consistency", "Communication", "Time Management", "Focus",
      "Emotional Intelligence", "Decision Making", "Public Speaking", "Leadership", "Problem Solving",
      "Critical Thinking", "Self Awareness", "Resilience", "Courage", "Patience", "Accountability",
      "Positive Thinking", "Personal Boundaries", "Growth Mindset"
    ]
  },
  {
    id: "38",
    name: "Wellness",
    subcategories: [
      "Sleep", "Hydration", "Nutrition", "Walking", "Meditation", "Breathing", "Stretching",
      "Rest Days", "Stress Relief", "Mindfulness", "Digital Detox", "Self Care", "Recovery",
      "Healthy Routines", "Sunlight", "Outdoor Time", "Relaxation", "Work-Life Balance",
      "Healthy Habits", "Wellbeing"
    ]
  },
  {
    id: "39",
    name: "Yoga",
    subcategories: [
      "Hatha Yoga", "Vinyasa Yoga", "Ashtanga Yoga", "Power Yoga", "Yin Yoga", "Kundalini Yoga",
      "Restorative Yoga", "Bikram Yoga", "Hot Yoga", "Prenatal Yoga", "Morning Yoga", "Evening Yoga",
      "Yoga Flow", "Balance Poses", "Inversion Poses", "Backbend Poses", "Hip Opening", "Flexibility",
      "Breathwork", "Meditation"
    ]
  },
  {
    id: "40",
    name: "Dance",
    subcategories: [
      "Dance Ideas", "Dance Stories", "Dance Experiences", "Dance Highlights", "Dance Discoveries",
      "Dance Recommendations", "Dance Guides", "Dance Collections", "Dance Moments", "Dance Events",
      "Dance Trends", "Dance Communities", "Dance Projects", "Dance Challenges", "Dance Favorites",
      "Dance Tips", "Dance Reviews", "Dance Inspiration", "Dance News", "Dance Showcase"
    ]
  },
  {
    id: "41",
    name: "Design",
    subcategories: [
      "Design Ideas", "Design Stories", "Design Experiences", "Design Highlights", "Design Discoveries",
      "Design Recommendations", "Design Guides", "Design Collections", "Design Moments", "Design Events",
      "Design Trends", "Design Communities", "Design Projects", "Design Challenges", "Design Favorites",
      "Design Tips", "Design Reviews", "Design Inspiration", "Design News", "Design Showcase"
    ]
  },
  {
    id: "42",
    name: "DIY",
    subcategories: [
      "DIY Ideas", "DIY Stories", "DIY Experiences", "DIY Highlights", "DIY Discoveries",
      "DIY Recommendations", "DIY Guides", "DIY Collections", "DIY Moments", "DIY Events",
      "DIY Trends", "DIY Communities", "DIY Projects", "DIY Challenges", "DIY Favorites",
      "DIY Tips", "DIY Reviews", "DIY Inspiration", "DIY News", "DIY Showcase"
    ]
  },
  {
    id: "43",
    name: "Education",
    subcategories: [
      "Education Ideas", "Education Stories", "Education Experiences", "Education Highlights",
      "Education Discoveries", "Education Recommendations", "Education Guides", "Education Collections",
      "Education Moments", "Education Events", "Education Trends", "Education Communities",
      "Education Projects", "Education Challenges", "Education Favorites", "Education Tips",
      "Education Reviews", "Education Inspiration", "Education News", "Education Showcase"
    ]
  },
  {
    id: "44",
    name: "Entrepreneurship",
    subcategories: [
      "Entrepreneurship Ideas", "Entrepreneurship Stories", "Entrepreneurship Experiences",
      "Entrepreneurship Highlights", "Entrepreneurship Discoveries", "Entrepreneurship Recommendations",
      "Entrepreneurship Guides", "Entrepreneurship Collections", "Entrepreneurship Moments",
      "Entrepreneurship Events", "Entrepreneurship Trends", "Entrepreneurship Communities",
      "Entrepreneurship Projects", "Entrepreneurship Challenges", "Entrepreneurship Favorites",
      "Entrepreneurship Tips", "Entrepreneurship Reviews", "Entrepreneurship Inspiration",
      "Entrepreneurship News", "Entrepreneurship Showcase"
    ]
  },
  {
    id: "45",
    name: "Events",
    subcategories: [
      "Events Ideas", "Events Stories", "Events Experiences", "Events Highlights", "Events Discoveries",
      "Events Recommendations", "Events Guides", "Events Collections", "Events Moments", "Events Events",
      "Events Trends", "Events Communities", "Events Projects", "Events Challenges", "Events Favorites",
      "Events Tips", "Events Reviews", "Events Inspiration", "Events News", "Events Showcase"
    ]
  },
  {
    id: "46",
    name: "Gardening",
    subcategories: [
      "Gardening Ideas", "Gardening Stories", "Gardening Experiences", "Gardening Highlights",
      "Gardening Discoveries", "Gardening Recommendations", "Gardening Guides", "Gardening Collections",
      "Gardening Moments", "Gardening Events", "Gardening Trends", "Gardening Communities",
      "Gardening Projects", "Gardening Challenges", "Gardening Favorites", "Gardening Tips",
      "Gardening Reviews", "Gardening Inspiration", "Gardening News", "Gardening Showcase"
    ]
  },
  {
    id: "47",
    name: "Goals",
    subcategories: [
      "Goals Ideas", "Goals Stories", "Goals Experiences", "Goals Highlights", "Goals Discoveries",
      "Goals Recommendations", "Goals Guides", "Goals Collections", "Goals Moments", "Goals Events",
      "Goals Trends", "Goals Communities", "Goals Projects", "Goals Challenges", "Goals Favorites",
      "Goals Tips", "Goals Reviews", "Goals Inspiration", "Goals News", "Goals Showcase"
    ]
  },
  {
    id: "48",
    name: "Hiking",
    subcategories: [
      "Hiking Ideas", "Hiking Stories", "Hiking Experiences", "Hiking Highlights", "Hiking Discoveries",
      "Hiking Recommendations", "Hiking Guides", "Hiking Collections", "Hiking Moments", "Hiking Events",
      "Hiking Trends", "Hiking Communities", "Hiking Projects", "Hiking Challenges", "Hiking Favorites",
      "Hiking Tips", "Hiking Reviews", "Hiking Inspiration", "Hiking News", "Hiking Showcase"
    ]
  },
  {
    id: "49",
    name: "History",
    subcategories: [
      "History Ideas", "History Stories", "History Experiences", "History Highlights", "History Discoveries",
      "History Recommendations", "History Guides", "History Collections", "History Moments", "History Events",
      "History Trends", "History Communities", "History Projects", "History Challenges", "History Favorites",
      "History Tips", "History Reviews", "History Inspiration", "History News", "History Showcase"
    ]
  },
  {
    id: "50",
    name: "Home",
    subcategories: [
      "Home Ideas", "Home Stories", "Home Experiences", "Home Highlights", "Home Discoveries",
      "Home Recommendations", "Home Guides", "Home Collections", "Home Moments", "Home Events",
      "Home Trends", "Home Communities", "Home Projects", "Home Challenges", "Home Favorites",
      "Home Tips", "Home Reviews", "Home Inspiration", "Home News", "Home Showcase"
    ]
  },
  {
    id: "51",
    name: "Inspiration",
    subcategories: [
      "Inspiration Ideas", "Inspiration Stories", "Inspiration Experiences", "Inspiration Highlights",
      "Inspiration Discoveries", "Inspiration Recommendations", "Inspiration Guides", "Inspiration Collections",
      "Inspiration Moments", "Inspiration Events", "Inspiration Trends", "Inspiration Communities",
      "Inspiration Projects", "Inspiration Challenges", "Inspiration Favorites", "Inspiration Tips",
      "Inspiration Reviews", "Inspiration Inspiration", "Inspiration News", "Inspiration Showcase"
    ]
  },
  {
    id: "52",
    name: "Investing",
    subcategories: [
      "Investing Ideas", "Investing Stories", "Investing Experiences", "Investing Highlights",
      "Investing Discoveries", "Investing Recommendations", "Investing Guides", "Investing Collections",
      "Investing Moments", "Investing Events", "Investing Trends", "Investing Communities",
      "Investing Projects", "Investing Challenges", "Investing Favorites", "Investing Tips",
      "Investing Reviews", "Investing Inspiration", "Investing News", "Investing Showcase"
    ]
  },
  {
    id: "53",
    name: "Journaling",
    subcategories: [
      "Journaling Ideas", "Journaling Stories", "Journaling Experiences", "Journaling Highlights",
      "Journaling Discoveries", "Journaling Recommendations", "Journaling Guides", "Journaling Collections",
      "Journaling Moments", "Journaling Events", "Journaling Trends", "Journaling Communities",
      "Journaling Projects", "Journaling Challenges", "Journaling Favorites", "Journaling Tips",
      "Journaling Reviews", "Journaling Inspiration", "Journaling News", "Journaling Showcase"
    ]
  },
  {
    id: "54",
    name: "Knowledge",
    subcategories: [
      "Knowledge Ideas", "Knowledge Stories", "Knowledge Experiences", "Knowledge Highlights",
      "Knowledge Discoveries", "Knowledge Recommendations", "Knowledge Guides", "Knowledge Collections",
      "Knowledge Moments", "Knowledge Events", "Knowledge Trends", "Knowledge Communities",
      "Knowledge Projects", "Knowledge Challenges", "Knowledge Favorites", "Knowledge Tips",
      "Knowledge Reviews", "Knowledge Inspiration", "Knowledge News", "Knowledge Showcase"
    ]
  },
  {
    id: "55",
    name: "Learning",
    subcategories: [
      "Learning Ideas", "Learning Stories", "Learning Experiences", "Learning Highlights",
      "Learning Discoveries", "Learning Recommendations", "Learning Guides", "Learning Collections",
      "Learning Moments", "Learning Events", "Learning Trends", "Learning Communities",
      "Learning Projects", "Learning Challenges", "Learning Favorites", "Learning Tips",
      "Learning Reviews", "Learning Inspiration", "Learning News", "Learning Showcase"
    ]
  },
  {
    id: "56",
    name: "Life Lessons",
    subcategories: [
      "Life Lessons Ideas", "Life Lessons Stories", "Life Lessons Experiences", "Life Lessons Highlights",
      "Life Lessons Discoveries", "Life Lessons Recommendations", "Life Lessons Guides", "Life Lessons Collections",
      "Life Lessons Moments", "Life Lessons Events", "Life Lessons Trends", "Life Lessons Communities",
      "Life Lessons Projects", "Life Lessons Challenges", "Life Lessons Favorites", "Life Lessons Tips",
      "Life Lessons Reviews", "Life Lessons Inspiration", "Life Lessons News", "Life Lessons Showcase"
    ]
  },
  {
    id: "57",
    name: "Lifestyle",
    subcategories: [
      "Lifestyle Ideas", "Lifestyle Stories", "Lifestyle Experiences", "Lifestyle Highlights",
      "Lifestyle Discoveries", "Lifestyle Recommendations", "Lifestyle Guides", "Lifestyle Collections",
      "Lifestyle Moments", "Lifestyle Events", "Lifestyle Trends", "Lifestyle Communities",
      "Lifestyle Projects", "Lifestyle Challenges", "Lifestyle Favorites", "Lifestyle Tips",
      "Lifestyle Reviews", "Lifestyle Inspiration", "Lifestyle News", "Lifestyle Showcase"
    ]
  },
  {
    id: "58",
    name: "Literature",
    subcategories: [
      "Literature Ideas", "Literature Stories", "Literature Experiences", "Literature Highlights",
      "Literature Discoveries", "Literature Recommendations", "Literature Guides", "Literature Collections",
      "Literature Moments", "Literature Events", "Literature Trends", "Literature Communities",
      "Literature Projects", "Literature Challenges", "Literature Favorites", "Literature Tips",
      "Literature Reviews", "Literature Inspiration", "Literature News", "Literature Showcase"
    ]
  },
  {
    id: "59",
    name: "Meditation",
    subcategories: [
      "Meditation Ideas", "Meditation Stories", "Meditation Experiences", "Meditation Highlights",
      "Meditation Discoveries", "Meditation Recommendations", "Meditation Guides", "Meditation Collections",
      "Meditation Moments", "Meditation Events", "Meditation Trends", "Meditation Communities",
      "Meditation Projects", "Meditation Challenges", "Meditation Favorites", "Meditation Tips",
      "Meditation Reviews", "Meditation Inspiration", "Meditation News", "Meditation Showcase"
    ]
  },
  {
    id: "60",
    name: "Networking",
    subcategories: [
      "Networking Ideas", "Networking Stories", "Networking Experiences", "Networking Highlights",
      "Networking Discoveries", "Networking Recommendations", "Networking Guides", "Networking Collections",
      "Networking Moments", "Networking Events", "Networking Trends", "Networking Communities",
      "Networking Projects", "Networking Challenges", "Networking Favorites", "Networking Tips",
      "Networking Reviews", "Networking Inspiration", "Networking News", "Networking Showcase"
    ]
  },
  {
    id: "61",
    name: "News",
    subcategories: [
      "News Ideas", "News Stories", "News Experiences", "News Highlights", "News Discoveries",
      "News Recommendations", "News Guides", "News Collections", "News Moments", "News Events",
      "News Trends", "News Communities", "News Projects", "News Challenges", "News Favorites",
      "News Tips", "News Reviews", "News Inspiration", "News News", "News Showcase"
    ]
  },
  {
    id: "62",
    name: "Podcasts",
    subcategories: [
      "Podcasts Ideas", "Podcasts Stories", "Podcasts Experiences", "Podcasts Highlights",
      "Podcasts Discoveries", "Podcasts Recommendations", "Podcasts Guides", "Podcasts Collections",
      "Podcasts Moments", "Podcasts Events", "Podcasts Trends", "Podcasts Communities",
      "Podcasts Projects", "Podcasts Challenges", "Podcasts Favorites", "Podcasts Tips",
      "Podcasts Reviews", "Podcasts Inspiration", "Podcasts News", "Podcasts Showcase"
    ]
  },
  {
    id: "63",
    name: "Psychology",
    subcategories: [
      "Psychology Ideas", "Psychology Stories", "Psychology Experiences", "Psychology Highlights",
      "Psychology Discoveries", "Psychology Recommendations", "Psychology Guides", "Psychology Collections",
      "Psychology Moments", "Psychology Events", "Psychology Trends", "Psychology Communities",
      "Psychology Projects", "Psychology Challenges", "Psychology Favorites", "Psychology Tips",
      "Psychology Reviews", "Psychology Inspiration", "Psychology News", "Psychology Showcase"
    ]
  },
  {
    id: "64",
    name: "Relationships",
    subcategories: [
      "Relationships Ideas", "Relationships Stories", "Relationships Experiences", "Relationships Highlights",
      "Relationships Discoveries", "Relationships Recommendations", "Relationships Guides", "Relationships Collections",
      "Relationships Moments", "Relationships Events", "Relationships Trends", "Relationships Communities",
      "Relationships Projects", "Relationships Challenges", "Relationships Favorites", "Relationships Tips",
      "Relationships Reviews", "Relationships Inspiration", "Relationships News", "Relationships Showcase"
    ]
  },
  {
    id: "65",
    name: "Science",
    subcategories: [
      "Science Ideas", "Science Stories", "Science Experiences", "Science Highlights",
      "Science Discoveries", "Science Recommendations", "Science Guides", "Science Collections",
      "Science Moments", "Science Events", "Science Trends", "Science Communities",
      "Science Projects", "Science Challenges", "Science Favorites", "Science Tips",
      "Science Reviews", "Science Inspiration", "Science News", "Science Showcase"
    ]
  },
  {
    id: "66",
    name: "Shopping",
    subcategories: [
      "Shopping Ideas", "Shopping Stories", "Shopping Experiences", "Shopping Highlights",
      "Shopping Discoveries", "Shopping Recommendations", "Shopping Guides", "Shopping Collections",
      "Shopping Moments", "Shopping Events", "Shopping Trends", "Shopping Communities",
      "Shopping Projects", "Shopping Challenges", "Shopping Favorites", "Shopping Tips",
      "Shopping Reviews", "Shopping Inspiration", "Shopping News", "Shopping Showcase"
    ]
  },
  {
    id: "67",
    name: "Skincare",
    subcategories: [
      "Skincare Ideas", "Skincare Stories", "Skincare Experiences", "Skincare Highlights",
      "Skincare Discoveries", "Skincare Recommendations", "Skincare Guides", "Skincare Collections",
      "Skincare Moments", "Skincare Events", "Skincare Trends", "Skincare Communities",
      "Skincare Projects", "Skincare Challenges", "Skincare Favorites", "Skincare Tips",
      "Skincare Reviews", "Skincare Inspiration", "Skincare News", "Skincare Showcase"
    ]
  },
  {
    id: "68",
    name: "Sleep",
    subcategories: [
      "Sleep Ideas", "Sleep Stories", "Sleep Experiences", "Sleep Highlights", "Sleep Discoveries",
      "Sleep Recommendations", "Sleep Guides", "Sleep Collections", "Sleep Moments", "Sleep Events",
      "Sleep Trends", "Sleep Communities", "Sleep Projects", "Sleep Challenges", "Sleep Favorites",
      "Sleep Tips", "Sleep Reviews", "Sleep Inspiration", "Sleep News", "Sleep Showcase"
    ]
  },
  {
    id: "69",
    name: "Space",
    subcategories: [
      "Space Ideas", "Space Stories", "Space Experiences", "Space Highlights", "Space Discoveries",
      "Space Recommendations", "Space Guides", "Space Collections", "Space Moments", "Space Events",
      "Space Trends", "Space Communities", "Space Projects", "Space Challenges", "Space Favorites",
      "Space Tips", "Space Reviews", "Space Inspiration", "Space News", "Space Showcase"
    ]
  },
  {
    id: "70",
    name: "Spirituality",
    subcategories: [
      "Spirituality Ideas", "Spirituality Stories", "Spirituality Experiences", "Spirituality Highlights",
      "Spirituality Discoveries", "Spirituality Recommendations", "Spirituality Guides", "Spirituality Collections",
      "Spirituality Moments", "Spirituality Events", "Spirituality Trends", "Spirituality Communities",
      "Spirituality Projects", "Spirituality Challenges", "Spirituality Favorites", "Spirituality Tips",
      "Spirituality Reviews", "Spirituality Inspiration", "Spirituality News", "Spirituality Showcase"
    ]
  },
  {
    id: "71",
    name: "Study",
    subcategories: [
      "Study Ideas", "Study Stories", "Study Experiences", "Study Highlights", "Study Discoveries",
      "Study Recommendations", "Study Guides", "Study Collections", "Study Moments", "Study Events",
      "Study Trends", "Study Communities", "Study Projects", "Study Challenges", "Study Favorites",
      "Study Tips", "Study Reviews", "Study Inspiration", "Study News", "Study Showcase"
    ]
  },
  {
    id: "72",
    name: "Volunteering",
    subcategories: [
      "Volunteering Ideas", "Volunteering Stories", "Volunteering Experiences", "Volunteering Highlights",
      "Volunteering Discoveries", "Volunteering Recommendations", "Volunteering Guides", "Volunteering Collections",
      "Volunteering Moments", "Volunteering Events", "Volunteering Trends", "Volunteering Communities",
      "Volunteering Projects", "Volunteering Challenges", "Volunteering Favorites", "Volunteering Tips",
      "Volunteering Reviews", "Volunteering Inspiration", "Volunteering News", "Volunteering Showcase"
    ]
  },
  {
    id: "73",
    name: "Walking",
    subcategories: [
      "Walking Ideas", "Walking Stories", "Walking Experiences", "Walking Highlights", "Walking Discoveries",
      "Walking Recommendations", "Walking Guides", "Walking Collections", "Walking Moments", "Walking Events",
      "Walking Trends", "Walking Communities", "Walking Projects", "Walking Challenges", "Walking Favorites",
      "Walking Tips", "Walking Reviews", "Walking Inspiration", "Walking News", "Walking Showcase"
    ]
  },
  {
    id: "74",
    name: "Writing",
    subcategories: [
      "Writing Ideas", "Writing Stories", "Writing Experiences", "Writing Highlights", "Writing Discoveries",
      "Writing Recommendations", "Writing Guides", "Writing Collections", "Writing Moments", "Writing Events",
      "Writing Trends", "Writing Communities", "Writing Projects", "Writing Challenges", "Writing Favorites",
      "Writing Tips", "Writing Reviews", "Writing Inspiration", "Writing News", "Writing Showcase"
    ]
  },
  {
    id: "75",
    name: "College Events",
    subcategories: [
      "College Events Ideas", "College Events Stories", "College Events Experiences", "College Events Highlights",
      "College Events Discoveries", "College Events Recommendations", "College Events Guides", "College Events Collections",
      "College Events Moments", "College Events Events", "College Events Trends", "College Events Communities",
      "College Events Projects", "College Events Challenges", "College Events Favorites", "College Events Tips",
      "College Events Reviews", "College Events Inspiration", "College Events News", "College Events Showcase"
    ]
  },
  {
    id: "76",
    name: "App Recommendations",
    subcategories: [
      "App Recommendations Ideas", "App Recommendations Stories", "App Recommendations Experiences",
      "App Recommendations Highlights", "App Recommendations Discoveries", "App Recommendations Recommendations",
      "App Recommendations Guides", "App Recommendations Collections", "App Recommendations Moments",
      "App Recommendations Events", "App Recommendations Trends", "App Recommendations Communities",
      "App Recommendations Projects", "App Recommendations Challenges", "App Recommendations Favorites",
      "App Recommendations Tips", "App Recommendations Reviews", "App Recommendations Inspiration",
      "App Recommendations News", "App Recommendations Showcase"
    ]
  },
  {
    id: "77",
    name: "Food Reviews",
    subcategories: [
      "Food Reviews Ideas", "Food Reviews Stories", "Food Reviews Experiences", "Food Reviews Highlights",
      "Food Reviews Discoveries", "Food Reviews Recommendations", "Food Reviews Guides", "Food Reviews Collections",
      "Food Reviews Moments", "Food Reviews Events", "Food Reviews Trends", "Food Reviews Communities",
      "Food Reviews Projects", "Food Reviews Challenges", "Food Reviews Favorites", "Food Reviews Tips",
      "Food Reviews Reviews", "Food Reviews Inspiration", "Food Reviews News", "Food Reviews Showcase"
    ]
  },
  {
    id: "78",
    name: "Transformation",
    subcategories: [
      "Transformation Ideas", "Transformation Stories", "Transformation Experiences", "Transformation Highlights",
      "Transformation Discoveries", "Transformation Recommendations", "Transformation Guides", "Transformation Collections",
      "Transformation Moments", "Transformation Events", "Transformation Trends", "Transformation Communities",
      "Transformation Projects", "Transformation Challenges", "Transformation Favorites", "Transformation Tips",
      "Transformation Reviews", "Transformation Inspiration", "Transformation News", "Transformation Showcase"
    ]
  },
  {
    id: "79",
    name: "Memes",
    subcategories: [
      "Memes Ideas", "Memes Stories", "Memes Experiences", "Memes Highlights", "Memes Discoveries",
      "Memes Recommendations", "Memes Guides", "Memes Collections", "Memes Moments", "Memes Events",
      "Memes Trends", "Memes Communities", "Memes Projects", "Memes Challenges", "Memes Favorites",
      "Memes Tips", "Memes Reviews", "Memes Inspiration", "Memes News", "Memes Showcase"
    ]
  },
  {
    id: "80",
    name: "Funny Moments",
    subcategories: [
      "Funny Moments Ideas", "Funny Moments Stories", "Funny Moments Experiences", "Funny Moments Highlights",
      "Funny Moments Discoveries", "Funny Moments Recommendations", "Funny Moments Guides", "Funny Moments Collections",
      "Funny Moments Moments", "Funny Moments Events", "Funny Moments Trends", "Funny Moments Communities",
      "Funny Moments Projects", "Funny Moments Challenges", "Funny Moments Favorites", "Funny Moments Tips",
      "Funny Moments Reviews", "Funny Moments Inspiration", "Funny Moments News", "Funny Moments Showcase"
    ]
  },
  {
    id: "81",
    name: "Internet Culture",
    subcategories: [
      "Internet Culture Ideas", "Internet Culture Stories", "Internet Culture Experiences", "Internet Culture Highlights",
      "Internet Culture Discoveries", "Internet Culture Recommendations", "Internet Culture Guides", "Internet Culture Collections",
      "Internet Culture Moments", "Internet Culture Events", "Internet Culture Trends", "Internet Culture Communities",
      "Internet Culture Projects", "Internet Culture Challenges", "Internet Culture Favorites", "Internet Culture Tips",
      "Internet Culture Reviews", "Internet Culture Inspiration", "Internet Culture News", "Internet Culture Showcase"
    ]
  },
  {
    id: "82",
    name: "Viral",
    subcategories: [
      "Viral Ideas", "Viral Stories", "Viral Experiences", "Viral Highlights", "Viral Discoveries",
      "Viral Recommendations", "Viral Guides", "Viral Collections", "Viral Moments", "Viral Events",
      "Viral Trends", "Viral Communities", "Viral Projects", "Viral Challenges", "Viral Favorites",
      "Viral Tips", "Viral Reviews", "Viral Inspiration", "Viral News", "Viral Showcase"
    ]
  },
  {
    id: "83",
    name: "Trends",
    subcategories: [
      "Trends Ideas", "Trends Stories", "Trends Experiences", "Trends Highlights", "Trends Discoveries",
      "Trends Recommendations", "Trends Guides", "Trends Collections", "Trends Moments", "Trends Events",
      "Trends Trends", "Trends Communities", "Trends Projects", "Trends Challenges", "Trends Favorites",
      "Trends Tips", "Trends Reviews", "Trends Inspiration", "Trends News", "Trends Showcase"
    ]
  },
  {
    id: "84",
    name: "Reactions",
    subcategories: [
      "Reactions Ideas", "Reactions Stories", "Reactions Experiences", "Reactions Highlights",
      "Reactions Discoveries", "Reactions Recommendations", "Reactions Guides", "Reactions Collections",
      "Reactions Moments", "Reactions Events", "Reactions Trends", "Reactions Communities",
      "Reactions Projects", "Reactions Challenges", "Reactions Favorites", "Reactions Tips",
      "Reactions Reviews", "Reactions Inspiration", "Reactions News", "Reactions Showcase"
    ]
  },
  {
    id: "85",
    name: "Opinions",
    subcategories: [
      "Opinions Ideas", "Opinions Stories", "Opinions Experiences", "Opinions Highlights",
      "Opinions Discoveries", "Opinions Recommendations", "Opinions Guides", "Opinions Collections",
      "Opinions Moments", "Opinions Events", "Opinions Trends", "Opinions Communities",
      "Opinions Projects", "Opinions Challenges", "Opinions Favorites", "Opinions Tips",
      "Opinions Reviews", "Opinions Inspiration", "Opinions News", "Opinions Showcase"
    ]
  },
  {
    id: "86",
    name: "Questions",
    subcategories: [
      "Questions Ideas", "Questions Stories", "Questions Experiences", "Questions Highlights",
      "Questions Discoveries", "Questions Recommendations", "Questions Guides", "Questions Collections",
      "Questions Moments", "Questions Events", "Questions Trends", "Questions Communities",
      "Questions Projects", "Questions Challenges", "Questions Favorites", "Questions Tips",
      "Questions Reviews", "Questions Inspiration", "Questions News", "Questions Showcase"
    ]
  },
  {
    id: "87",
    name: "Polls",
    subcategories: [
      "Polls Ideas", "Polls Stories", "Polls Experiences", "Polls Highlights", "Polls Discoveries",
      "Polls Recommendations", "Polls Guides", "Polls Collections", "Polls Moments", "Polls Events",
      "Polls Trends", "Polls Communities", "Polls Projects", "Polls Challenges", "Polls Favorites",
      "Polls Tips", "Polls Reviews", "Polls Inspiration", "Polls News", "Polls Showcase"
    ]
  },
  {
    id: "88",
    name: "Discussions",
    subcategories: [
      "Discussions Ideas", "Discussions Stories", "Discussions Experiences", "Discussions Highlights",
      "Discussions Discoveries", "Discussions Recommendations", "Discussions Guides", "Discussions Collections",
      "Discussions Moments", "Discussions Events", "Discussions Trends", "Discussions Communities",
      "Discussions Projects", "Discussions Challenges", "Discussions Favorites", "Discussions Tips",
      "Discussions Reviews", "Discussions Inspiration", "Discussions News", "Discussions Showcase"
    ]
  },
  {
    id: "89",
    name: "Debates",
    subcategories: [
      "Debates Ideas", "Debates Stories", "Debates Experiences", "Debates Highlights",
      "Debates Discoveries", "Debates Recommendations", "Debates Guides", "Debates Collections",
      "Debates Moments", "Debates Events", "Debates Trends", "Debates Communities",
      "Debates Projects", "Debates Challenges", "Debates Favorites", "Debates Tips",
      "Debates Reviews", "Debates Inspiration", "Debates News", "Debates Showcase"
    ]
  },
  {
    id: "90",
    name: "Random Thoughts",
    subcategories: [
      "Random Thoughts Ideas", "Random Thoughts Stories", "Random Thoughts Experiences",
      "Random Thoughts Highlights", "Random Thoughts Discoveries", "Random Thoughts Recommendations",
      "Random Thoughts Guides", "Random Thoughts Collections", "Random Thoughts Moments",
      "Random Thoughts Events", "Random Thoughts Trends", "Random Thoughts Communities",
      "Random Thoughts Projects", "Random Thoughts Challenges", "Random Thoughts Favorites",
      "Random Thoughts Tips", "Random Thoughts Reviews", "Random Thoughts Inspiration",
      "Random Thoughts News", "Random Thoughts Showcase"
    ]
  },
  {
    id: "91",
    name: "Confessions",
    subcategories: [
      "Confessions Ideas", "Confessions Stories", "Confessions Experiences", "Confessions Highlights",
      "Confessions Discoveries", "Confessions Recommendations", "Confessions Guides", "Confessions Collections",
      "Confessions Moments", "Confessions Events", "Confessions Trends", "Confessions Communities",
      "Confessions Projects", "Confessions Challenges", "Confessions Favorites", "Confessions Tips",
      "Confessions Reviews", "Confessions Inspiration", "Confessions News", "Confessions Showcase"
    ]
  },
  {
    id: "92",
    name: "Stories",
    subcategories: [
      "Stories Ideas", "Stories Stories", "Stories Experiences", "Stories Highlights",
      "Stories Discoveries", "Stories Recommendations", "Stories Guides", "Stories Collections",
      "Stories Moments", "Stories Events", "Stories Trends", "Stories Communities",
      "Stories Projects", "Stories Challenges", "Stories Favorites", "Stories Tips",
      "Stories Reviews", "Stories Inspiration", "Stories News", "Stories Showcase"
    ]
  },
  {
    id: "93",
    name: "Experiences",
    subcategories: [
      "Experiences Ideas", "Experiences Stories", "Experiences Experiences", "Experiences Highlights",
      "Experiences Discoveries", "Experiences Recommendations", "Experiences Guides", "Experiences Collections",
      "Experiences Moments", "Experiences Events", "Experiences Trends", "Experiences Communities",
      "Experiences Projects", "Experiences Challenges", "Experiences Favorites", "Experiences Tips",
      "Experiences Reviews", "Experiences Inspiration", "Experiences News", "Experiences Showcase"
    ]
  },
  {
    id: "94",
    name: "Memories",
    subcategories: [
      "Memories Ideas", "Memories Stories", "Memories Experiences", "Memories Highlights",
      "Memories Discoveries", "Memories Recommendations", "Memories Guides", "Memories Collections",
      "Memories Moments", "Memories Events", "Memories Trends", "Memories Communities",
      "Memories Projects", "Memories Challenges", "Memories Favorites", "Memories Tips",
      "Memories Reviews", "Memories Inspiration", "Memories News", "Memories Showcase"
    ]
  },
  {
    id: "95",
    name: "Childhood",
    subcategories: [
      "Childhood Ideas", "Childhood Stories", "Childhood Experiences", "Childhood Highlights",
      "Childhood Discoveries", "Childhood Recommendations", "Childhood Guides", "Childhood Collections",
      "Childhood Moments", "Childhood Events", "Childhood Trends", "Childhood Communities",
      "Childhood Projects", "Childhood Challenges", "Childhood Favorites", "Childhood Tips",
      "Childhood Reviews", "Childhood Inspiration", "Childhood News", "Childhood Showcase"
    ]
  },
  {
    id: "96",
    name: "Nostalgia",
    subcategories: [
      "Nostalgia Ideas", "Nostalgia Stories", "Nostalgia Experiences", "Nostalgia Highlights",
      "Nostalgia Discoveries", "Nostalgia Recommendations", "Nostalgia Guides", "Nostalgia Collections",
      "Nostalgia Moments", "Nostalgia Events", "Nostalgia Trends", "Nostalgia Communities",
      "Nostalgia Projects", "Nostalgia Challenges", "Nostalgia Favorites", "Nostalgia Tips",
      "Nostalgia Reviews", "Nostalgia Inspiration", "Nostalgia News", "Nostalgia Showcase"
    ]
  },
  {
    id: "97",
    name: "Friendships",
    subcategories: [
      "Friendships Ideas", "Friendships Stories", "Friendships Experiences", "Friendships Highlights",
      "Friendships Discoveries", "Friendships Recommendations", "Friendships Guides", "Friendships Collections",
      "Friendships Moments", "Friendships Events", "Friendships Trends", "Friendships Communities",
      "Friendships Projects", "Friendships Challenges", "Friendships Favorites", "Friendships Tips",
      "Friendships Reviews", "Friendships Inspiration", "Friendships News", "Friendships Showcase"
    ]
  },
  {
    id: "98",
    name: "Family",
    subcategories: [
      "Family Ideas", "Family Stories", "Family Experiences", "Family Highlights", "Family Discoveries",
      "Family Recommendations", "Family Guides", "Family Collections", "Family Moments", "Family Events",
      "Family Trends", "Family Communities", "Family Projects", "Family Challenges", "Family Favorites",
      "Family Tips", "Family Reviews", "Family Inspiration", "Family News", "Family Showcase"
    ]
  },
  {
    id: "99",
    name: "Dating",
    subcategories: [
      "Dating Ideas", "Dating Stories", "Dating Experiences", "Dating Highlights", "Dating Discoveries",
      "Dating Recommendations", "Dating Guides", "Dating Collections", "Dating Moments", "Dating Events",
      "Dating Trends", "Dating Communities", "Dating Projects", "Dating Challenges", "Dating Favorites",
      "Dating Tips", "Dating Reviews", "Dating Inspiration", "Dating News", "Dating Showcase"
    ]
  },
  {
    id: "100",
    name: "Social Life",
    subcategories: [
      "Social Life Ideas", "Social Life Stories", "Social Life Experiences", "Social Life Highlights",
      "Social Life Discoveries", "Social Life Recommendations", "Social Life Guides", "Social Life Collections",
      "Social Life Moments", "Social Life Events", "Social Life Trends", "Social Life Communities",
      "Social Life Projects", "Social Life Challenges", "Social Life Favorites", "Social Life Tips",
      "Social Life Reviews", "Social Life Inspiration", "Social Life News", "Social Life Showcase"
    ]
  },
  {
    id: "101",
    name: "Human Connection",
    subcategories: [
      "Human Connection Ideas", "Human Connection Stories", "Human Connection Experiences",
      "Human Connection Highlights", "Human Connection Discoveries", "Human Connection Recommendations",
      "Human Connection Guides", "Human Connection Collections", "Human Connection Moments",
      "Human Connection Events", "Human Connection Trends", "Human Connection Communities",
      "Human Connection Projects", "Human Connection Challenges", "Human Connection Favorites",
      "Human Connection Tips", "Human Connection Reviews", "Human Connection Inspiration",
      "Human Connection News", "Human Connection Showcase"
    ]
  },
  {
    id: "102",
    name: "Kindness",
    subcategories: [
      "Kindness Ideas", "Kindness Stories", "Kindness Experiences", "Kindness Highlights",
      "Kindness Discoveries", "Kindness Recommendations", "Kindness Guides", "Kindness Collections",
      "Kindness Moments", "Kindness Events", "Kindness Trends", "Kindness Communities",
      "Kindness Projects", "Kindness Challenges", "Kindness Favorites", "Kindness Tips",
      "Kindness Reviews", "Kindness Inspiration", "Kindness News", "Kindness Showcase"
    ]
  },
  {
    id: "103",
    name: "Gratitude",
    subcategories: [
      "Gratitude Ideas", "Gratitude Stories", "Gratitude Experiences", "Gratitude Highlights",
      "Gratitude Discoveries", "Gratitude Recommendations", "Gratitude Guides", "Gratitude Collections",
      "Gratitude Moments", "Gratitude Events", "Gratitude Trends", "Gratitude Communities",
      "Gratitude Projects", "Gratitude Challenges", "Gratitude Favorites", "Gratitude Tips",
      "Gratitude Reviews", "Gratitude Inspiration", "Gratitude News", "Gratitude Showcase"
    ]
  },
  {
    id: "104",
    name: "Motivation",
    subcategories: [
      "Motivation Ideas", "Motivation Stories", "Motivation Experiences", "Motivation Highlights",
      "Motivation Discoveries", "Motivation Recommendations", "Motivation Guides", "Motivation Collections",
      "Motivation Moments", "Motivation Events", "Motivation Trends", "Motivation Communities",
      "Motivation Projects", "Motivation Challenges", "Motivation Favorites", "Motivation Tips",
      "Motivation Reviews", "Motivation Inspiration", "Motivation News", "Motivation Showcase"
    ]
  },
  {
    id: "105",
    name: "Mindfulness",
    subcategories: [
      "Mindfulness Ideas", "Mindfulness Stories", "Mindfulness Experiences", "Mindfulness Highlights",
      "Mindfulness Discoveries", "Mindfulness Recommendations", "Mindfulness Guides", "Mindfulness Collections",
      "Mindfulness Moments", "Mindfulness Events", "Mindfulness Trends", "Mindfulness Communities",
      "Mindfulness Projects", "Mindfulness Challenges", "Mindfulness Favorites", "Mindfulness Tips",
      "Mindfulness Reviews", "Mindfulness Inspiration", "Mindfulness News", "Mindfulness Showcase"
    ]
  },
  {
    id: "106",
    name: "Mental Wellness",
    subcategories: [
      "Mental Wellness Ideas", "Mental Wellness Stories", "Mental Wellness Experiences",
      "Mental Wellness Highlights", "Mental Wellness Discoveries", "Mental Wellness Recommendations",
      "Mental Wellness Guides", "Mental Wellness Collections", "Mental Wellness Moments",
      "Mental Wellness Events", "Mental Wellness Trends", "Mental Wellness Communities",
      "Mental Wellness Projects", "Mental Wellness Challenges", "Mental Wellness Favorites",
      "Mental Wellness Tips", "Mental Wellness Reviews", "Mental Wellness Inspiration",
      "Mental Wellness News", "Mental Wellness Showcase"
    ]
  },
  {
    id: "107",
    name: "Digital Detox",
    subcategories: [
      "Digital Detox Ideas", "Digital Detox Stories", "Digital Detox Experiences", "Digital Detox Highlights",
      "Digital Detox Discoveries", "Digital Detox Recommendations", "Digital Detox Guides", "Digital Detox Collections",
      "Digital Detox Moments", "Digital Detox Events", "Digital Detox Trends", "Digital Detox Communities",
      "Digital Detox Projects", "Digital Detox Challenges", "Digital Detox Favorites", "Digital Detox Tips",
      "Digital Detox Reviews", "Digital Detox Inspiration", "Digital Detox News", "Digital Detox Showcase"
    ]
  },
  {
    id: "108",
    name: "Minimalism",
    subcategories: [
      "Minimalism Ideas", "Minimalism Stories", "Minimalism Experiences", "Minimalism Highlights",
      "Minimalism Discoveries", "Minimalism Recommendations", "Minimalism Guides", "Minimalism Collections",
      "Minimalism Moments", "Minimalism Events", "Minimalism Trends", "Minimalism Communities",
      "Minimalism Projects", "Minimalism Challenges", "Minimalism Favorites", "Minimalism Tips",
      "Minimalism Reviews", "Minimalism Inspiration", "Minimalism News", "Minimalism Showcase"
    ]
  },
  {
    id: "109",
    name: "Daily Life",
    subcategories: [
      "Daily Life Ideas", "Daily Life Stories", "Daily Life Experiences", "Daily Life Highlights",
      "Daily Life Discoveries", "Daily Life Recommendations", "Daily Life Guides", "Daily Life Collections",
      "Daily Life Moments", "Daily Life Events", "Daily Life Trends", "Daily Life Communities",
      "Daily Life Projects", "Daily Life Challenges", "Daily Life Favorites", "Daily Life Tips",
      "Daily Life Reviews", "Daily Life Inspiration", "Daily Life News", "Daily Life Showcase"
    ]
  },
  {
    id: "110",
    name: "Weekend",
    subcategories: [
      "Weekend Ideas", "Weekend Stories", "Weekend Experiences", "Weekend Highlights",
      "Weekend Discoveries", "Weekend Recommendations", "Weekend Guides", "Weekend Collections",
      "Weekend Moments", "Weekend Events", "Weekend Trends", "Weekend Communities",
      "Weekend Projects", "Weekend Challenges", "Weekend Favorites", "Weekend Tips",
      "Weekend Reviews", "Weekend Inspiration", "Weekend News", "Weekend Showcase"
    ]
  },
  {
    id: "111",
    name: "Celebrations",
    subcategories: [
      "Celebrations Ideas", "Celebrations Stories", "Celebrations Experiences", "Celebrations Highlights",
      "Celebrations Discoveries", "Celebrations Recommendations", "Celebrations Guides", "Celebrations Collections",
      "Celebrations Moments", "Celebrations Events", "Celebrations Trends", "Celebrations Communities",
      "Celebrations Projects", "Celebrations Challenges", "Celebrations Favorites", "Celebrations Tips",
      "Celebrations Reviews", "Celebrations Inspiration", "Celebrations News", "Celebrations Showcase"
    ]
  },
  {
    id: "112",
    name: "Birthdays",
    subcategories: [
      "Birthdays Ideas", "Birthdays Stories", "Birthdays Experiences", "Birthdays Highlights",
      "Birthdays Discoveries", "Birthdays Recommendations", "Birthdays Guides", "Birthdays Collections",
      "Birthdays Moments", "Birthdays Events", "Birthdays Trends", "Birthdays Communities",
      "Birthdays Projects", "Birthdays Challenges", "Birthdays Favorites", "Birthdays Tips",
      "Birthdays Reviews", "Birthdays Inspiration", "Birthdays News", "Birthdays Showcase"
    ]
  },
  {
    id: "113",
    name: "Festivals",
    subcategories: [
      "Festivals Ideas", "Festivals Stories", "Festivals Experiences", "Festivals Highlights",
      "Festivals Discoveries", "Festivals Recommendations", "Festivals Guides", "Festivals Collections",
      "Festivals Moments", "Festivals Events", "Festivals Trends", "Festivals Communities",
      "Festivals Projects", "Festivals Challenges", "Festivals Favorites", "Festivals Tips",
      "Festivals Reviews", "Festivals Inspiration", "Festivals News", "Festivals Showcase"
    ]
  },
  {
    id: "114",
    name: "Crafts",
    subcategories: [
      "Crafts Ideas", "Crafts Stories", "Crafts Experiences", "Crafts Highlights", "Crafts Discoveries",
      "Crafts Recommendations", "Crafts Guides", "Crafts Collections", "Crafts Moments", "Crafts Events",
      "Crafts Trends", "Crafts Communities", "Crafts Projects", "Crafts Challenges", "Crafts Favorites",
      "Crafts Tips", "Crafts Reviews", "Crafts Inspiration", "Crafts News", "Crafts Showcase"
    ]
  },
  {
    id: "115",
    name: "Challenges",
    subcategories: [
      "Challenges Ideas", "Challenges Stories", "Challenges Experiences", "Challenges Highlights",
      "Challenges Discoveries", "Challenges Recommendations", "Challenges Guides", "Challenges Collections",
      "Challenges Moments", "Challenges Events", "Challenges Trends", "Challenges Communities",
      "Challenges Projects", "Challenges Challenges", "Challenges Favorites", "Challenges Tips",
      "Challenges Reviews", "Challenges Inspiration", "Challenges News", "Challenges Showcase"
    ]
  },
  {
    id: "116",
    name: "Milestones",
    subcategories: [
      "Milestones Ideas", "Milestones Stories", "Milestones Experiences", "Milestones Highlights",
      "Milestones Discoveries", "Milestones Recommendations", "Milestones Guides", "Milestones Collections",
      "Milestones Moments", "Milestones Events", "Milestones Trends", "Milestones Communities",
      "Milestones Projects", "Milestones Challenges", "Milestones Favorites", "Milestones Tips",
      "Milestones Reviews", "Milestones Inspiration", "Milestones News", "Milestones Showcase"
    ]
  },
  {
    id: "117",
    name: "Anything Goes",
    subcategories: [
      "Anything Goes Ideas", "Anything Goes Stories", "Anything Goes Experiences", "Anything Goes Highlights",
      "Anything Goes Discoveries", "Anything Goes Recommendations", "Anything Goes Guides", "Anything Goes Collections",
      "Anything Goes Moments", "Anything Goes Events", "Anything Goes Trends", "Anything Goes Communities",
      "Anything Goes Projects", "Anything Goes Challenges", "Anything Goes Favorites", "Anything Goes Tips",
      "Anything Goes Reviews", "Anything Goes Inspiration", "Anything Goes News", "Anything Goes Showcase"
    ]
  }
];

export function searchCategories(query: string): { mainCategory: MainCategory; matchingSubcategories: string[] }[] {
  if (!query || query.trim() === '') {
    return CATEGORIES_DATA.map(cat => ({
      mainCategory: cat,
      matchingSubcategories: cat.subcategories,
    }));
  }

  const q = query.toLowerCase().trim();
  const results: { mainCategory: MainCategory; matchingSubcategories: string[] }[] = [];

  for (const cat of CATEGORIES_DATA) {
    const mainMatches = cat.name.toLowerCase().includes(q);
    const matchingSubs = cat.subcategories.filter(sub => sub.toLowerCase().includes(q));

    if (mainMatches || matchingSubs.length > 0) {
      results.push({
        mainCategory: cat,
        matchingSubcategories: mainMatches ? cat.subcategories : matchingSubs,
      });
    }
  }

  return results;
}
