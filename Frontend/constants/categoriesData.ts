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
      "Dogs", "Cats", "Birds", "Fish",
      "Horses", "Rabbits", "Hamsters", "Guinea Pigs",
      "Reptiles", "Turtles", "Snakes", "Butterflies",
      "Bees", "Dolphins", "Whales", "Elephants",
      "Tigers", "Lions", "Pandas", "Wildlife"
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
      "Moon", "Sun", "Planets", "Stars",
      "Constellations", "Galaxies", "Nebulae", "Black Holes",
      "Comets", "Asteroids", "Meteors", "Eclipses",
      "Aurora", "Space Missions", "Space Telescopes", "Exoplanets",
      "Milky Way", "Cosmology", "Astronauts", "Stargazing"
    ]
  },
  {
    id: "9",
    name: "Automotive",
    subcategories: [
      "Sedans", "SUVs", "Hatchbacks", "Sports Cars",
      "Supercars", "Hypercars", "Electric Cars", "Hybrid Cars",
      "Classic Cars", "Muscle Cars", "Luxury Cars", "Pickup Trucks",
      "Off-Road Vehicles", "Rally Cars", "Race Cars", "Car Modifications",
      "Car Detailing", "Car Photography", "Car Meets", "Driving"
    ]
  },
  {
    id: "10",
    name: "Badminton",
    subcategories: [
      "Singles", "Doubles", "Mixed Doubles", "Professional Badminton",
      "Club Badminton", "School Badminton", "Badminton Training", "Smash",
      "Drop Shot", "Clear Shot", "Net Play", "Footwork",
      "Badminton Fitness", "Badminton Rackets", "Badminton Shoes", "Badminton Courts",
      "Badminton Tournaments", "Match Highlights", "Badminton Players", "Badminton News"
    ]
  },
  {
    id: "11",
    name: "Basketball",
    subcategories: [
      "NBA", "WNBA", "College Basketball", "Street Basketball",
      "3x3 Basketball", "International Basketball", "Basketball Training", "Dribbling",
      "Shooting", "Dunking", "Defense", "Rebounding",
      "Basketball Fitness", "Basketball Gear", "Basketball Courts", "Basketball Tournaments",
      "Basketball Highlights", "Basketball Records", "Basketball Players", "Basketball News"
    ]
  },
  {
    id: "12",
    name: "Books",
    subcategories: [
      "Fiction", "Non-Fiction", "Mystery", "Thriller",
      "Romance", "Fantasy", "Science Fiction", "Biography",
      "Autobiography", "Self-Help", "Psychology", "Business Books",
      "Finance Books", "History Books", "Science Books", "Philosophy",
      "Poetry", "Comics", "Manga", "Graphic Novels"
    ]
  },
  {
    id: "13",
    name: "Business",
    subcategories: [
      "Business Ideas", "Small Business", "E-Commerce", "Retail",
      "Marketing", "Sales", "Operations", "Management",
      "Customer Service", "Business Strategy", "Branding", "Business Analytics",
      "Franchising", "Family Business", "B2B", "B2C",
      "Local Business", "Online Business", "Business Case Studies", "Business News"
    ]
  },
  {
    id: "14",
    name: "Career",
    subcategories: [
      "Programming", "Software Development", "UI/UX Design", "Data Science",
      "Cybersecurity", "Digital Marketing", "Sales", "Finance",
      "Accounting", "Human Resources", "Project Management", "Product Management",
      "Business Analysis", "Consulting", "Content Creation", "Graphic Design",
      "Video Editing", "Teaching", "Healthcare", "Freelancing"
    ]
  },
  {
    id: "15",
    name: "Coding",
    subcategories: [
      "Coding Ideas", "Coding Stories", "Coding Experiences", "Coding Highlights",
      "Coding Discoveries", "Coding Recommendations", "Coding Guides", "Coding Collections",
      "Coding Moments", "Coding Events", "Coding Trends", "Coding Communities",
      "Coding Projects", "Coding Challenges", "Coding Favorites", "Coding Tips",
      "Coding Reviews", "Coding Inspiration", "Coding News", "Coding Showcase"
    ]
  },
  {
    id: "16",
    name: "College Life",
    subcategories: [
      "College Classes", "Campus Life", "College Friends", "College Clubs",
      "College Festivals", "College Events", "College Projects", "College Assignments",
      "College Exams", "Hostel Life", "College Sports", "College Canteen",
      "College Trips", "College Memories", "Freshers", "Graduation",
      "Student Communities", "Internships", "College Competitions", "Student Life"
    ]
  },
  {
    id: "17",
    name: "Comedy",
    subcategories: [
      "Stand-Up Comedy", "Sketch Comedy", "Situational Comedy", "Dark Comedy",
      "Observational Comedy", "Satire", "Parody", "Pranks",
      "Funny Stories", "Funny Videos", "Funny Photos", "One-Liners",
      "Dad Jokes", "Roasts", "Impressions", "Comedy Shows",
      "Comedy Movies", "Comedy Reactions", "Funny Fails", "Everyday Humor"
    ]
  },
  {
    id: "18",
    name: "Community",
    subcategories: [
      "Local Communities", "Student Communities", "Developer Communities", "Sports Communities",
      "Fitness Communities", "Creator Communities", "Book Communities", "Gaming Communities",
      "Travel Communities", "Volunteer Groups", "Meetups", "Clubs",
      "Online Communities", "Neighborhoods", "Community Projects", "Fundraisers",
      "Social Causes", "Support Groups", "Community Events", "Community Stories"
    ]
  },
  {
    id: "19",
    name: "Cooking",
    subcategories: [
      "Breakfast", "Lunch", "Dinner", "Snacks",
      "Soups", "Salads", "Grilling", "Baking",
      "Roasting", "Frying", "Air Fryer", "Meal Prep",
      "Sauces", "Pasta Making", "Bread Making", "Pizza Making",
      "Dessert Making", "Fermentation", "Pickling", "Plating"
    ]
  },
  {
    id: "20",
    name: "Cricket",
    subcategories: [
      "Test Cricket", "ODI Cricket", "T20 Cricket", "IPL",
      "International Cricket", "Domestic Cricket", "Club Cricket", "Street Cricket",
      "Batting", "Bowling", "Fielding", "Wicketkeeping",
      "Cricket Training", "Cricket Gear", "Cricket Grounds", "Cricket Records",
      "Cricket Tournaments", "Match Highlights", "Cricket Fans", "Cricket News"
    ]
  },
  {
    id: "21",
    name: "Cycling",
    subcategories: [
      "Cycling Ideas", "Cycling Stories", "Cycling Experiences", "Cycling Highlights",
      "Cycling Discoveries", "Cycling Recommendations", "Cycling Guides", "Cycling Collections",
      "Cycling Moments", "Cycling Events", "Cycling Trends", "Cycling Communities",
      "Cycling Projects", "Cycling Challenges", "Cycling Favorites", "Cycling Tips",
      "Cycling Reviews", "Cycling Inspiration", "Cycling News", "Cycling Showcase"
    ]
  },
  {
    id: "22",
    name: "Dance",
    subcategories: [
      "Dance Ideas", "Dance Stories", "Dance Experiences", "Dance Highlights",
      "Dance Discoveries", "Dance Recommendations", "Dance Guides", "Dance Collections",
      "Dance Moments", "Dance Events", "Dance Trends", "Dance Communities",
      "Dance Projects", "Dance Challenges", "Dance Favorites", "Dance Tips",
      "Dance Reviews", "Dance Inspiration", "Dance News", "Dance Showcase"
    ]
  },
  {
    id: "23",
    name: "Design",
    subcategories: [
      "Design Ideas", "Design Stories", "Design Experiences", "Design Highlights",
      "Design Discoveries", "Design Recommendations", "Design Guides", "Design Collections",
      "Design Moments", "Design Events", "Design Trends", "Design Communities",
      "Design Projects", "Design Challenges", "Design Favorites", "Design Tips",
      "Design Reviews", "Design Inspiration", "Design News", "Design Showcase"
    ]
  },
  {
    id: "24",
    name: "DIY",
    subcategories: [
      "DIY Ideas", "DIY Stories", "DIY Experiences", "DIY Highlights",
      "DIY Discoveries", "DIY Recommendations", "DIY Guides", "DIY Collections",
      "DIY Moments", "DIY Events", "DIY Trends", "DIY Communities",
      "DIY Projects", "DIY Challenges", "DIY Favorites", "DIY Tips",
      "DIY Reviews", "DIY Inspiration", "DIY News", "DIY Showcase"
    ]
  },
  {
    id: "25",
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
    id: "26",
    name: "Entrepreneurship",
    subcategories: [
      "Entrepreneurship Ideas", "Entrepreneurship Stories", "Entrepreneurship Experiences", "Entrepreneurship Highlights",
      "Entrepreneurship Discoveries", "Entrepreneurship Recommendations", "Entrepreneurship Guides", "Entrepreneurship Collections",
      "Entrepreneurship Moments", "Entrepreneurship Events", "Entrepreneurship Trends", "Entrepreneurship Communities",
      "Entrepreneurship Projects", "Entrepreneurship Challenges", "Entrepreneurship Favorites", "Entrepreneurship Tips",
      "Entrepreneurship Reviews", "Entrepreneurship Inspiration", "Entrepreneurship News", "Entrepreneurship Showcase"
    ]
  },
  {
    id: "27",
    name: "Events",
    subcategories: [
      "Events Ideas", "Events Stories", "Events Experiences", "Events Highlights",
      "Events Discoveries", "Events Recommendations", "Events Guides", "Events Collections",
      "Events Moments", "Events Events", "Events Trends", "Events Communities",
      "Events Projects", "Events Challenges", "Events Favorites", "Events Tips",
      "Events Reviews", "Events Inspiration", "Events News", "Events Showcase"
    ]
  },
  {
    id: "28",
    name: "Exercise",
    subcategories: [
      "Push-Ups", "Pull-Ups", "Squats", "Lunges",
      "Plank", "Burpees", "Jump Rope", "Running",
      "Cycling", "Swimming", "Walking", "Stretching",
      "Yoga", "HIIT", "Weight Training", "Core Workout",
      "Leg Workout", "Arm Workout", "Full Body Workout", "Mobility"
    ]
  },
  {
    id: "29",
    name: "Fashion",
    subcategories: [
      "Casual Wear", "Formal Wear", "Streetwear", "Athleisure",
      "Party Wear", "Traditional Wear", "Office Wear", "Summer Wear",
      "Winter Wear", "Denim", "T-Shirts", "Shirts",
      "Jackets", "Dresses", "Suits", "Ethnic Wear",
      "Accessories", "Watches", "Bags", "Footwear"
    ]
  },
  {
    id: "30",
    name: "Finance",
    subcategories: [
      "Budgeting", "Saving", "Investing", "Stocks",
      "Mutual Funds", "ETFs", "Bonds", "Retirement",
      "Taxes", "Credit Cards", "Loans", "Insurance",
      "Emergency Fund", "Expense Tracking", "Passive Income", "Side Income",
      "Real Estate", "Cryptocurrency", "Financial Planning", "Money Management"
    ]
  },
  {
    id: "31",
    name: "Fitness",
    subcategories: [
      "Weightlifting", "Powerlifting", "Bodybuilding", "Calisthenics",
      "CrossFit", "HIIT", "Cardio", "Cycling",
      "Running", "Swimming", "Yoga", "Pilates",
      "Boxing", "Kickboxing", "Martial Arts", "Mobility Training",
      "Flexibility Training", "Core Training", "Functional Training", "Sports Conditioning"
    ]
  },
  {
    id: "32",
    name: "Food",
    subcategories: [
      "Noodles", "Sushi", "Ramen", "Pizza",
      "Burger", "Tacos", "Burritos", "Sandwiches",
      "Wraps", "Dumplings", "Fried Rice", "Biryani",
      "Curry", "Steak", "BBQ", "Fried Chicken",
      "Salads", "Soups", "Cheesecake", "Ice Cream"
    ]
  },
  {
    id: "33",
    name: "Football",
    subcategories: [
      "Football Ideas", "Football Stories", "Football Experiences", "Football Highlights",
      "Football Discoveries", "Football Recommendations", "Football Guides", "Football Collections",
      "Football Moments", "Football Events", "Football Trends", "Football Communities",
      "Football Projects", "Football Challenges", "Football Favorites", "Football Tips",
      "Football Reviews", "Football Inspiration", "Football News", "Football Showcase"
    ]
  },
  {
    id: "34",
    name: "Gaming",
    subcategories: [
      "Action Games", "RPG", "FPS", "Racing Games",
      "Sports Games", "Strategy Games", "Simulation Games", "Survival Games",
      "Horror Games", "Puzzle Games", "Open World", "Battle Royale",
      "MOBA", "Fighting Games", "Platformers", "Indie Games",
      "Co-op Games", "Mobile Games", "PC Games", "Console Games"
    ]
  },
  {
    id: "35",
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
    id: "36",
    name: "Goals",
    subcategories: [
      "Goals Ideas", "Goals Stories", "Goals Experiences", "Goals Highlights",
      "Goals Discoveries", "Goals Recommendations", "Goals Guides", "Goals Collections",
      "Goals Moments", "Goals Events", "Goals Trends", "Goals Communities",
      "Goals Projects", "Goals Challenges", "Goals Favorites", "Goals Tips",
      "Goals Reviews", "Goals Inspiration", "Goals News", "Goals Showcase"
    ]
  },
  {
    id: "37",
    name: "Hiking",
    subcategories: [
      "Hiking Ideas", "Hiking Stories", "Hiking Experiences", "Hiking Highlights",
      "Hiking Discoveries", "Hiking Recommendations", "Hiking Guides", "Hiking Collections",
      "Hiking Moments", "Hiking Events", "Hiking Trends", "Hiking Communities",
      "Hiking Projects", "Hiking Challenges", "Hiking Favorites", "Hiking Tips",
      "Hiking Reviews", "Hiking Inspiration", "Hiking News", "Hiking Showcase"
    ]
  },
  {
    id: "38",
    name: "History",
    subcategories: [
      "History Ideas", "History Stories", "History Experiences", "History Highlights",
      "History Discoveries", "History Recommendations", "History Guides", "History Collections",
      "History Moments", "History Events", "History Trends", "History Communities",
      "History Projects", "History Challenges", "History Favorites", "History Tips",
      "History Reviews", "History Inspiration", "History News", "History Showcase"
    ]
  },
  {
    id: "39",
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
    id: "40",
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
    id: "41",
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
    id: "42",
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
    id: "43",
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
    id: "44",
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
    id: "45",
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
    id: "46",
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
    id: "47",
    name: "Movies",
    subcategories: [
      "Action", "Comedy", "Drama", "Thriller",
      "Horror", "Romance", "Sci-Fi", "Fantasy",
      "Animation", "Documentary", "Mystery", "Crime",
      "Adventure", "Biography", "Historical", "Superhero",
      "Psychological", "Indie Films", "Short Films", "Movie Classics"
    ]
  },
  {
    id: "48",
    name: "Music",
    subcategories: [
      "Pop", "Rock", "Hip Hop", "Rap",
      "R&B", "Jazz", "Blues", "Classical",
      "Electronic", "EDM", "Indie", "Lo-fi",
      "Metal", "Punk", "Reggae", "Country",
      "K-Pop", "Bollywood Music", "Instrumental", "Live Music"
    ]
  },
  {
    id: "49",
    name: "Nature",
    subcategories: [
      "Forests", "Mountains", "Rivers", "Lakes",
      "Beaches", "Waterfalls", "Deserts", "Islands",
      "Wildlife", "Birdwatching", "Sunsets", "Sunrises",
      "Flowers", "Trees", "Gardens", "National Parks",
      "Hiking Trails", "Weather", "Seasons", "Stargazing"
    ]
  },
  {
    id: "50",
    name: "Photography",
    subcategories: [
      "Portraits", "Street Photography", "Landscape Photography", "Wildlife Photography",
      "Food Photography", "Product Photography", "Travel Photography", "Astrophotography",
      "Sports Photography", "Architecture Photography", "Macro Photography", "Night Photography",
      "Long Exposure", "Black & White", "Mobile Photography", "Film Photography",
      "Event Photography", "Wedding Photography", "Drone Photography", "Self Portraits"
    ]
  },
  {
    id: "51",
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
    id: "52",
    name: "Productivity",
    subcategories: [
      "Deep Work", "Time Blocking", "Pomodoro", "Task Lists",
      "Priority Setting", "Focus Sessions", "Weekly Planning", "Daily Planning",
      "Calendar Blocking", "Note Taking", "Inbox Zero", "Workspace Setup",
      "Distraction Blocking", "Automation", "Routine Building", "Goal Tracking",
      "Project Planning", "Meeting Management", "Energy Management", "Procrastination Control"
    ]
  },
  {
    id: "53",
    name: "Programming",
    subcategories: [
      "HTML", "CSS", "JavaScript", "TypeScript",
      "Python", "Java", "C", "C++",
      "C#", "Go", "Rust", "PHP",
      "Swift", "Kotlin", "React", "React Native",
      "Node.js", "Django", "Flutter", "SQL"
    ]
  },
  {
    id: "54",
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
    id: "55",
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
    id: "56",
    name: "Running",
    subcategories: [
      "Running Ideas", "Running Stories", "Running Experiences", "Running Highlights",
      "Running Discoveries", "Running Recommendations", "Running Guides", "Running Collections",
      "Running Moments", "Running Events", "Running Trends", "Running Communities",
      "Running Projects", "Running Challenges", "Running Favorites", "Running Tips",
      "Running Reviews", "Running Inspiration", "Running News", "Running Showcase"
    ]
  },
  {
    id: "57",
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
    id: "58",
    name: "Self Improvement",
    subcategories: [
      "Confidence", "Discipline", "Consistency", "Communication",
      "Time Management", "Focus", "Emotional Intelligence", "Decision Making",
      "Public Speaking", "Leadership", "Problem Solving", "Critical Thinking",
      "Self Awareness", "Resilience", "Courage", "Patience",
      "Accountability", "Positive Thinking", "Personal Boundaries", "Growth Mindset"
    ]
  },
  {
    id: "59",
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
    id: "60",
    name: "Sleep",
    subcategories: [
      "Sleep Ideas", "Sleep Stories", "Sleep Experiences", "Sleep Highlights",
      "Sleep Discoveries", "Sleep Recommendations", "Sleep Guides", "Sleep Collections",
      "Sleep Moments", "Sleep Events", "Sleep Trends", "Sleep Communities",
      "Sleep Projects", "Sleep Challenges", "Sleep Favorites", "Sleep Tips",
      "Sleep Reviews", "Sleep Inspiration", "Sleep News", "Sleep Showcase"
    ]
  },
  {
    id: "61",
    name: "Space",
    subcategories: [
      "Space Ideas", "Space Stories", "Space Experiences", "Space Highlights",
      "Space Discoveries", "Space Recommendations", "Space Guides", "Space Collections",
      "Space Moments", "Space Events", "Space Trends", "Space Communities",
      "Space Projects", "Space Challenges", "Space Favorites", "Space Tips",
      "Space Reviews", "Space Inspiration", "Space News", "Space Showcase"
    ]
  },
  {
    id: "62",
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
    id: "63",
    name: "Study",
    subcategories: [
      "Study Ideas", "Study Stories", "Study Experiences", "Study Highlights",
      "Study Discoveries", "Study Recommendations", "Study Guides", "Study Collections",
      "Study Moments", "Study Events", "Study Trends", "Study Communities",
      "Study Projects", "Study Challenges", "Study Favorites", "Study Tips",
      "Study Reviews", "Study Inspiration", "Study News", "Study Showcase"
    ]
  },
  {
    id: "64",
    name: "Swimming",
    subcategories: [
      "Swimming Ideas", "Swimming Stories", "Swimming Experiences", "Swimming Highlights",
      "Swimming Discoveries", "Swimming Recommendations", "Swimming Guides", "Swimming Collections",
      "Swimming Moments", "Swimming Events", "Swimming Trends", "Swimming Communities",
      "Swimming Projects", "Swimming Challenges", "Swimming Favorites", "Swimming Tips",
      "Swimming Reviews", "Swimming Inspiration", "Swimming News", "Swimming Showcase"
    ]
  },
  {
    id: "65",
    name: "Technology",
    subcategories: [
      "Smartphones", "Laptops", "Tablets", "Smartwatches",
      "Wireless Earbuds", "Gaming Consoles", "Cameras", "Drones",
      "Smart TVs", "VR Headsets", "AI", "Robotics",
      "3D Printers", "Smart Home", "Wearables", "Electric Vehicles",
      "Cloud Computing", "Blockchain", "AR/VR", "Internet of Things"
    ]
  },
  {
    id: "66",
    name: "Tennis",
    subcategories: [
      "Tennis Ideas", "Tennis Stories", "Tennis Experiences", "Tennis Highlights",
      "Tennis Discoveries", "Tennis Recommendations", "Tennis Guides", "Tennis Collections",
      "Tennis Moments", "Tennis Events", "Tennis Trends", "Tennis Communities",
      "Tennis Projects", "Tennis Challenges", "Tennis Favorites", "Tennis Tips",
      "Tennis Reviews", "Tennis Inspiration", "Tennis News", "Tennis Showcase"
    ]
  },
  {
    id: "67",
    name: "Travel",
    subcategories: [
      "City Trips", "Beach Trips", "Mountain Trips", "Forest Trips",
      "Desert Trips", "Island Trips", "Road Trips", "Train Trips",
      "Backpacking", "Solo Travel", "Family Trips", "Luxury Travel",
      "Budget Travel", "Adventure Travel", "Food Trips", "Wildlife Trips",
      "Cultural Trips", "Weekend Getaways", "Hidden Places", "International Trips"
    ]
  },
  {
    id: "68",
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
    id: "69",
    name: "Walking",
    subcategories: [
      "Walking Ideas", "Walking Stories", "Walking Experiences", "Walking Highlights",
      "Walking Discoveries", "Walking Recommendations", "Walking Guides", "Walking Collections",
      "Walking Moments", "Walking Events", "Walking Trends", "Walking Communities",
      "Walking Projects", "Walking Challenges", "Walking Favorites", "Walking Tips",
      "Walking Reviews", "Walking Inspiration", "Walking News", "Walking Showcase"
    ]
  },
  {
    id: "70",
    name: "Wellness",
    subcategories: [
      "Sleep", "Hydration", "Nutrition", "Walking",
      "Meditation", "Breathing", "Stretching", "Rest Days",
      "Stress Relief", "Mindfulness", "Digital Detox", "Self Care",
      "Recovery", "Healthy Routines", "Sunlight", "Outdoor Time",
      "Relaxation", "Work-Life Balance", "Healthy Habits", "Wellbeing"
    ]
  },
  {
    id: "71",
    name: "Writing",
    subcategories: [
      "Writing Ideas", "Writing Stories", "Writing Experiences", "Writing Highlights",
      "Writing Discoveries", "Writing Recommendations", "Writing Guides", "Writing Collections",
      "Writing Moments", "Writing Events", "Writing Trends", "Writing Communities",
      "Writing Projects", "Writing Challenges", "Writing Favorites", "Writing Tips",
      "Writing Reviews", "Writing Inspiration", "Writing News", "Writing Showcase"
    ]
  },
  {
    id: "72",
    name: "Yoga",
    subcategories: [
      "Hatha Yoga", "Vinyasa Yoga", "Ashtanga Yoga", "Power Yoga",
      "Yin Yoga", "Kundalini Yoga", "Restorative Yoga", "Bikram Yoga",
      "Hot Yoga", "Prenatal Yoga", "Morning Yoga", "Evening Yoga",
      "Yoga Flow", "Balance Poses", "Inversion Poses", "Backbend Poses",
      "Hip Opening", "Flexibility", "Breathwork", "Meditation"
    ]
  },
  {
    id: "73",
    name: "Career Growth",
    subcategories: [
      "Career Growth Ideas", "Career Growth Stories", "Career Growth Experiences", "Career Growth Highlights",
      "Career Growth Discoveries", "Career Growth Recommendations", "Career Growth Guides", "Career Growth Collections",
      "Career Growth Moments", "Career Growth Events", "Career Growth Trends", "Career Growth Communities",
      "Career Growth Projects", "Career Growth Challenges", "Career Growth Favorites", "Career Growth Tips",
      "Career Growth Reviews", "Career Growth Inspiration", "Career Growth News", "Career Growth Showcase"
    ]
  },
  {
    id: "74",
    name: "First Job",
    subcategories: [
      "First Job Ideas", "First Job Stories", "First Job Experiences", "First Job Highlights",
      "First Job Discoveries", "First Job Recommendations", "First Job Guides", "First Job Collections",
      "First Job Moments", "First Job Events", "First Job Trends", "First Job Communities",
      "First Job Projects", "First Job Challenges", "First Job Favorites", "First Job Tips",
      "First Job Reviews", "First Job Inspiration", "First Job News", "First Job Showcase"
    ]
  },
  {
    id: "75",
    name: "Internship",
    subcategories: [
      "Internship Ideas", "Internship Stories", "Internship Experiences", "Internship Highlights",
      "Internship Discoveries", "Internship Recommendations", "Internship Guides", "Internship Collections",
      "Internship Moments", "Internship Events", "Internship Trends", "Internship Communities",
      "Internship Projects", "Internship Challenges", "Internship Favorites", "Internship Tips",
      "Internship Reviews", "Internship Inspiration", "Internship News", "Internship Showcase"
    ]
  },
  {
    id: "76",
    name: "Exams",
    subcategories: [
      "Exams Ideas", "Exams Stories", "Exams Experiences", "Exams Highlights",
      "Exams Discoveries", "Exams Recommendations", "Exams Guides", "Exams Collections",
      "Exams Moments", "Exams Events", "Exams Trends", "Exams Communities",
      "Exams Projects", "Exams Challenges", "Exams Favorites", "Exams Tips",
      "Exams Reviews", "Exams Inspiration", "Exams News", "Exams Showcase"
    ]
  },
  {
    id: "77",
    name: "Graduation",
    subcategories: [
      "Graduation Ideas", "Graduation Stories", "Graduation Experiences", "Graduation Highlights",
      "Graduation Discoveries", "Graduation Recommendations", "Graduation Guides", "Graduation Collections",
      "Graduation Moments", "Graduation Events", "Graduation Trends", "Graduation Communities",
      "Graduation Projects", "Graduation Challenges", "Graduation Favorites", "Graduation Tips",
      "Graduation Reviews", "Graduation Inspiration", "Graduation News", "Graduation Showcase"
    ]
  },
  {
    id: "78",
    name: "New Skills",
    subcategories: [
      "New Skills Ideas", "New Skills Stories", "New Skills Experiences", "New Skills Highlights",
      "New Skills Discoveries", "New Skills Recommendations", "New Skills Guides", "New Skills Collections",
      "New Skills Moments", "New Skills Events", "New Skills Trends", "New Skills Communities",
      "New Skills Projects", "New Skills Challenges", "New Skills Favorites", "New Skills Tips",
      "New Skills Reviews", "New Skills Inspiration", "New Skills News", "New Skills Showcase"
    ]
  },
  {
    id: "79",
    name: "Certifications",
    subcategories: [
      "Certifications Ideas", "Certifications Stories", "Certifications Experiences", "Certifications Highlights",
      "Certifications Discoveries", "Certifications Recommendations", "Certifications Guides", "Certifications Collections",
      "Certifications Moments", "Certifications Events", "Certifications Trends", "Certifications Communities",
      "Certifications Projects", "Certifications Challenges", "Certifications Favorites", "Certifications Tips",
      "Certifications Reviews", "Certifications Inspiration", "Certifications News", "Certifications Showcase"
    ]
  },
  {
    id: "80",
    name: "Projects",
    subcategories: [
      "Projects Ideas", "Projects Stories", "Projects Experiences", "Projects Highlights",
      "Projects Discoveries", "Projects Recommendations", "Projects Guides", "Projects Collections",
      "Projects Moments", "Projects Events", "Projects Trends", "Projects Communities",
      "Projects Projects", "Projects Challenges", "Projects Favorites", "Projects Tips",
      "Projects Reviews", "Projects Inspiration", "Projects News", "Projects Showcase"
    ]
  },
  {
    id: "81",
    name: "Hackathons",
    subcategories: [
      "Hackathons Ideas", "Hackathons Stories", "Hackathons Experiences", "Hackathons Highlights",
      "Hackathons Discoveries", "Hackathons Recommendations", "Hackathons Guides", "Hackathons Collections",
      "Hackathons Moments", "Hackathons Events", "Hackathons Trends", "Hackathons Communities",
      "Hackathons Projects", "Hackathons Challenges", "Hackathons Favorites", "Hackathons Tips",
      "Hackathons Reviews", "Hackathons Inspiration", "Hackathons News", "Hackathons Showcase"
    ]
  },
  {
    id: "82",
    name: "Public Speaking",
    subcategories: [
      "Public Speaking Ideas", "Public Speaking Stories", "Public Speaking Experiences", "Public Speaking Highlights",
      "Public Speaking Discoveries", "Public Speaking Recommendations", "Public Speaking Guides", "Public Speaking Collections",
      "Public Speaking Moments", "Public Speaking Events", "Public Speaking Trends", "Public Speaking Communities",
      "Public Speaking Projects", "Public Speaking Challenges", "Public Speaking Favorites", "Public Speaking Tips",
      "Public Speaking Reviews", "Public Speaking Inspiration", "Public Speaking News", "Public Speaking Showcase"
    ]
  },
  {
    id: "83",
    name: "Leadership",
    subcategories: [
      "Leadership Ideas", "Leadership Stories", "Leadership Experiences", "Leadership Highlights",
      "Leadership Discoveries", "Leadership Recommendations", "Leadership Guides", "Leadership Collections",
      "Leadership Moments", "Leadership Events", "Leadership Trends", "Leadership Communities",
      "Leadership Projects", "Leadership Challenges", "Leadership Favorites", "Leadership Tips",
      "Leadership Reviews", "Leadership Inspiration", "Leadership News", "Leadership Showcase"
    ]
  },
  {
    id: "84",
    name: "Teamwork",
    subcategories: [
      "Teamwork Ideas", "Teamwork Stories", "Teamwork Experiences", "Teamwork Highlights",
      "Teamwork Discoveries", "Teamwork Recommendations", "Teamwork Guides", "Teamwork Collections",
      "Teamwork Moments", "Teamwork Events", "Teamwork Trends", "Teamwork Communities",
      "Teamwork Projects", "Teamwork Challenges", "Teamwork Favorites", "Teamwork Tips",
      "Teamwork Reviews", "Teamwork Inspiration", "Teamwork News", "Teamwork Showcase"
    ]
  },
  {
    id: "85",
    name: "Travel Tips",
    subcategories: [
      "Travel Tips Ideas", "Travel Tips Stories", "Travel Tips Experiences", "Travel Tips Highlights",
      "Travel Tips Discoveries", "Travel Tips Recommendations", "Travel Tips Guides", "Travel Tips Collections",
      "Travel Tips Moments", "Travel Tips Events", "Travel Tips Trends", "Travel Tips Communities",
      "Travel Tips Projects", "Travel Tips Challenges", "Travel Tips Favorites", "Travel Tips Tips",
      "Travel Tips Reviews", "Travel Tips Inspiration", "Travel Tips News", "Travel Tips Showcase"
    ]
  },
  {
    id: "86",
    name: "Road Trips",
    subcategories: [
      "Road Trips Ideas", "Road Trips Stories", "Road Trips Experiences", "Road Trips Highlights",
      "Road Trips Discoveries", "Road Trips Recommendations", "Road Trips Guides", "Road Trips Collections",
      "Road Trips Moments", "Road Trips Events", "Road Trips Trends", "Road Trips Communities",
      "Road Trips Projects", "Road Trips Challenges", "Road Trips Favorites", "Road Trips Tips",
      "Road Trips Reviews", "Road Trips Inspiration", "Road Trips News", "Road Trips Showcase"
    ]
  },
  {
    id: "87",
    name: "Camping",
    subcategories: [
      "Camping Ideas", "Camping Stories", "Camping Experiences", "Camping Highlights",
      "Camping Discoveries", "Camping Recommendations", "Camping Guides", "Camping Collections",
      "Camping Moments", "Camping Events", "Camping Trends", "Camping Communities",
      "Camping Projects", "Camping Challenges", "Camping Favorites", "Camping Tips",
      "Camping Reviews", "Camping Inspiration", "Camping News", "Camping Showcase"
    ]
  },
  {
    id: "88",
    name: "Street Food",
    subcategories: [
      "Street Food Ideas", "Street Food Stories", "Street Food Experiences", "Street Food Highlights",
      "Street Food Discoveries", "Street Food Recommendations", "Street Food Guides", "Street Food Collections",
      "Street Food Moments", "Street Food Events", "Street Food Trends", "Street Food Communities",
      "Street Food Projects", "Street Food Challenges", "Street Food Favorites", "Street Food Tips",
      "Street Food Reviews", "Street Food Inspiration", "Street Food News", "Street Food Showcase"
    ]
  },
  {
    id: "89",
    name: "Recipes",
    subcategories: [
      "Recipes Ideas", "Recipes Stories", "Recipes Experiences", "Recipes Highlights",
      "Recipes Discoveries", "Recipes Recommendations", "Recipes Guides", "Recipes Collections",
      "Recipes Moments", "Recipes Events", "Recipes Trends", "Recipes Communities",
      "Recipes Projects", "Recipes Challenges", "Recipes Favorites", "Recipes Tips",
      "Recipes Reviews", "Recipes Inspiration", "Recipes News", "Recipes Showcase"
    ]
  },
  {
    id: "90",
    name: "Restaurants",
    subcategories: [
      "Restaurants Ideas", "Restaurants Stories", "Restaurants Experiences", "Restaurants Highlights",
      "Restaurants Discoveries", "Restaurants Recommendations", "Restaurants Guides", "Restaurants Collections",
      "Restaurants Moments", "Restaurants Events", "Restaurants Trends", "Restaurants Communities",
      "Restaurants Projects", "Restaurants Challenges", "Restaurants Favorites", "Restaurants Tips",
      "Restaurants Reviews", "Restaurants Inspiration", "Restaurants News", "Restaurants Showcase"
    ]
  },
  {
    id: "91",
    name: "Sports Moments",
    subcategories: [
      "Sports Moments Ideas", "Sports Moments Stories", "Sports Moments Experiences", "Sports Moments Highlights",
      "Sports Moments Discoveries", "Sports Moments Recommendations", "Sports Moments Guides", "Sports Moments Collections",
      "Sports Moments Moments", "Sports Moments Events", "Sports Moments Trends", "Sports Moments Communities",
      "Sports Moments Projects", "Sports Moments Challenges", "Sports Moments Favorites", "Sports Moments Tips",
      "Sports Moments Reviews", "Sports Moments Inspiration", "Sports Moments News", "Sports Moments Showcase"
    ]
  },
  {
    id: "92",
    name: "Memes",
    subcategories: [
      "Memes Ideas", "Memes Stories", "Memes Experiences", "Memes Highlights",
      "Memes Discoveries", "Memes Recommendations", "Memes Guides", "Memes Collections",
      "Memes Moments", "Memes Events", "Memes Trends", "Memes Communities",
      "Memes Projects", "Memes Challenges", "Memes Favorites", "Memes Tips",
      "Memes Reviews", "Memes Inspiration", "Memes News", "Memes Showcase"
    ]
  },
  {
    id: "93",
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
    id: "94",
    name: "Viral",
    subcategories: [
      "Viral Ideas", "Viral Stories", "Viral Experiences", "Viral Highlights",
      "Viral Discoveries", "Viral Recommendations", "Viral Guides", "Viral Collections",
      "Viral Moments", "Viral Events", "Viral Trends", "Viral Communities",
      "Viral Projects", "Viral Challenges", "Viral Favorites", "Viral Tips",
      "Viral Reviews", "Viral Inspiration", "Viral News", "Viral Showcase"
    ]
  },
  {
    id: "95",
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
    id: "96",
    name: "Polls",
    subcategories: [
      "Polls Ideas", "Polls Stories", "Polls Experiences", "Polls Highlights",
      "Polls Discoveries", "Polls Recommendations", "Polls Guides", "Polls Collections",
      "Polls Moments", "Polls Events", "Polls Trends", "Polls Communities",
      "Polls Projects", "Polls Challenges", "Polls Favorites", "Polls Tips",
      "Polls Reviews", "Polls Inspiration", "Polls News", "Polls Showcase"
    ]
  },
  {
    id: "97",
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
    id: "98",
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
    id: "99",
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
    id: "100",
    name: "Friendships",
    subcategories: [
      "Friendships Ideas", "Friendships Stories", "Friendships Experiences", "Friendships Highlights",
      "Friendships Discoveries", "Friendships Recommendations", "Friendships Guides", "Friendships Collections",
      "Friendships Moments", "Friendships Events", "Friendships Trends", "Friendships Communities",
      "Friendships Projects", "Friendships Challenges", "Friendships Favorites", "Friendships Tips",
      "Friendships Reviews", "Friendships Inspiration", "Friendships News", "Friendships Showcase"
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
