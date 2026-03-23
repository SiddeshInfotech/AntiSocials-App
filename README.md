# AntiSocials App 🚀

Welcome to the **AntiSocials App** monorepo! This application is designed to help users step away from endless scrolling and build real-world connections, hit their life goals (Mind, Body, Spirit, etc.), and monitor their healthy habits using specialized interconnected dashboards.

---

## 🛠️ Recent Core Features & Technical Fixes 

This branch features some massive UI integrations and squashes some of the peskiest React Native routing bugs. Here is a comprehensive overview of everything recently implemented in the codebase:

### 1. 🤝 Seamless Complex Merge Resolution
Successfully resolved deep additive and structural merge conflicts across `frontend-dev` and `feature/mahim`. 
* **The Best of Both Worlds:** Merged the highly complex, mathematically calculated SVG Life Domains Dashboard (including interactive vector animals and ring nodes) with the robust bottom tab sub-routing for `[Profile, Heart, People, Tasks, Activities]`.
* **Dependency Upgrades:** Safely integrated `react-native-svg` to power the complex vector interfaces while resolving `package.json` lockfile conflicts.

### 2. 📸 Advanced Native Image Picker (Profile Edit)
Fully overhauled the `edit-profile.tsx` screen to act and feel like a professional native application.
* **Intelligent Action Sheets:** Tapping the user avatar (or "Change Photo") now opens a beautiful selection prompt asking you to explicitly pick between taking a live photo with your **Camera** or selecting an existing photo from the **Device Gallery**.
* **Permissions Handling:** Securely handles hardware system queries (requesting camera and media access) through `expo-image-picker` prior to launching the native view. 
* **Instant Native Feedback:** The UI dynamically registers the returned local URI from the camera and overlays the new cropped image flawlessly over your placeholder.

### 3. 💥 Zero-Crash Whitespace Safety
Combated the notorious `Text strings must be rendered within a <Text> component.` crash that crippled the Home Screen layout:
* Hunted down rogue trailing string spaces in heavily commented JSX mapping routines (`renderTaskItem`).
* Stripped unsafe `{/* */}` block patterns that were breaking Babel evaluations of `<View>` wrappers, making the entire `index.tsx` completely crash-safe.

### 4. 📱 Fluid Safe Area Context Injection 
Ripped out the deprecated, buggy local `react-native` `SafeAreaView` functionality that let the App UI violently collide with the clock and battery icons on modern hardware notches/islands.
* Transitioned the overarching framework explicitly to `react-native-safe-area-context`.
* Used the advanced `useSafeAreaInsets()` hook to programmatically push the Dashboard header padding down by exactly the height of the user's explicit device status bar. 

### 5. 🌗 Bulletproof Dynamic Status Bar Toggling
Obliterated an annoying routing bug where rendering a light-icon status bar on the purple `Profile` screen caused the icons to become permanently invisible/white when shifting back over to the white `Home` screen.
* Imported the `useIsFocused` hook perfectly from `@react-navigation/native` alongside `expo-status-bar`.
* Forced the `index.tsx` Home Screen to strictly apply `<StatusBar style="dark" />` conditionally upon active component focus.
* Forced the `profile.tsx` dashboard to conditionally apply `<StatusBar style="light" />` allowing for safe tear-down when unmounted, keeping your clock and battery legible 100% of the time, regardless of what Tab you are interacting with.

---

## 📂 Project Structure

```text
AntiSocials-App/
├── Frontend/           # React Native / Expo Router Codebase 
├── Backend/            # API, Authentication, and Database Logic 
└── README.md           # Overarching Project Overview (You are here)
```

Thank you for contributing to AntiSocials, creating a world where your daily habits build lasting real-life connections!
