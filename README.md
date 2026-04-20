# AntiSocials

Welcome to the **AntiSocials** repository! 

A unified social platform aiming to minimize endless scrolling and maximize real-life connections, trusted activities, and meaningful experiences.

## 🗂️ Project Structure

This monorepo handles both the backend server architecture and the frontend interface for AntiSocials.

* **`/Frontend`**: Our mobile client, built with **Expo** and **React Native**. It utilizes Expo Router for file-based navigation, Reanimated for fluid gesture-based onboarding carousels, and Native integrations like Image Pickers and Local File handling.
* **`/Backend`**: The core API, built securely on **Node.js** & **Express** (`v5`). Currently set up with standardized Middlewares (`cors`, `body-parser`) and environment handling via `dotenv` laying the foundation for our upcoming database integration schemas.

## 🚀 Getting Started

To run the application locally, you will need to spin up both modules in separate terminal instances.

### 1. Launch the Backend API
Navigate to the backend directory, install the required dependencies, and execute the server:
```bash
cd Backend
npm install
node index.js
```

### 2. Launch the Mobile Client
Open a second terminal window, navigate to the frontend directory, install Expo tools, and start the development environment:
```bash
cd Frontend
npm install
npm start
```

Press `a` in your terminal to open it via Android Emulator, `i` via iOS Simulator, or simply use the **Expo Go** application on your physical device to scan the QR code output.

## 🤝 Contribution Guidelines
When preparing a PR, make sure you branch off appropriately based on the component you are modifying (e.g., frontend developers should branch from `frontend-dev`). 

Ensure any changes pass generic syntax validation methods (such as Typescript's `tsc --noEmit` on the Expo stack) before finalizing your commits.
