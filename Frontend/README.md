# AntiSocials - Frontend

Welcome to the frontend repository for **AntiSocials**. 
A social platform designed to minimize endless scrolling and maximize real-life connections, activities, and experiences.

## 🚀 Branch: `frontend-dev`
This branch contains all the latest merged UI features and frontend layouts currently in development.

### Core Features & Workflows
* **Authentication Flow:** Phone Number Login and OTP verification (`app/index.tsx` & `app/otp.tsx`).
* **Profile Setup:** "Let people know the real you" registration page (`app/signup.tsx`).
* **Interactive Onboarding:** Reanimated, gesture-driven horizontal swipe carousel explaining the app's core values (`app/onboarding.tsx`).
* **Main Dashboard & Layouts:** Expo-Router configured tab layout (`app/(tabs)/`).
* **Activities Feed:** Discover and join nearby activities, dynamic tab switching between 'Discover' and 'Joined', and a 'Create Activity' screen (`app/(tabs)/activities.tsx` & `app/create-activity.tsx`).
* **Comprehensive Profile:** A rich interactive profile tracking Streaks, Ranks, Badges, Habits, and Activity metrics seamlessly integrated with our Express/PostgreSQL backend (`app/(tabs)/profile.tsx`).
* **Account Configurations:** Dynamic screens for modifying personal data including Edit Profile, Privacy Settings, Notifications, and Interests. These securely sync changes to the backend in real-time (`app/edit-profile.tsx`, `app/your-interests.tsx`).

## 🛠️ Tech Stack
* **Framework:** [Expo](https://expo.dev) / React Native
* **Navigation:** Expo Router (File-based routing)
* **Styling:** React Native StyleSheet & `expo-linear-gradient`
* **Icons:** `@expo/vector-icons` (Feather)
* **Animations:** `react-native-reanimated` & `react-native-gesture-handler`

## 📦 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Application**
   ```bash
   npx expo start
   ```
   Or to explicitly target a specific port or clear cache:
   ```bash
   npx expo start -c
   ```

   In the output, simply scan the QR code via the **Expo Go** app on your physical device, or press `a`/`i` to start your Android/iOS emulator directly from the terminal prompts.

## 🤝 Development
* Do your development work on scoped feature branches (e.g., `feature/<your-name>`).
* Ensure code compiles correctly without Typescript errors using `npx tsc --noEmit` before opening Pull Requests.
* Make sure you avoid library version mismatches by running `npx expo install <package-name>` when adding native packages.
