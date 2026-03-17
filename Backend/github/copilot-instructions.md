# Copilot Instructions — AntiSocials Backend (Tasks MVP)

## Project Overview

This project is the backend for the **AntiSocials mobile application**.
The backend is built using **Node.js, TypeScript, Express, Prisma ORM, and PostgreSQL**.

The application focuses on **behavioral development through daily tasks**, tracking user progress, rewarding completion, and maintaining a wallet/streak system.

The current goal is to implement the **Tasks MVP**, which includes authentication, daily tasks, wallet rewards, streak tracking, and life-circle scoring.

Copilot should prioritize **clean architecture, modular code, and transactional safety**.

---

# Tech Stack

Backend:

- Node.js
- TypeScript
- Express.js

Database:

- PostgreSQL
- Prisma ORM

Validation:

- Zod

Authentication:

- JWT
- Email + Password
- Phone + OTP

---

# Backend Architecture

Follow a **modular architecture**.

```
src/
 ├── modules/
 │    ├── auth/
 │    ├── tasks/
 │    ├── wallet/
 │    └── lifeCircle/
 │
 ├── middleware/
 │    ├── auth.ts
 │    └── rateLimit.ts
 │
 ├── config/
 │    └── env.ts
 │
 ├── constants/
 │    ├── tasks.ts
 │    └── scoring.ts
 │
 ├── jobs/
 │    └── decayJob.ts
 │
 ├── lib/
 │    └── prisma.ts
 │
 └── app.ts
```

Rules:

- Routers define HTTP endpoints
- Services contain business logic
- Engines contain algorithms
- Prisma is used for all database access

Never access the database directly inside routers.

---

# Database Design Principles

Use **PostgreSQL with Prisma ORM**.

All primary keys must be **UUID**.

All timestamps should use **UTC**.

Database tables:

Core Entities:

- User
- AuthIdentity
- OTPVerification

Tasks System:

- Task
- UserDailyTask
- UserTaskCompletion

Reward System:

- UserWallet
- WalletTransaction

User Progress:

- UserStreak
- LifeCircleScore

Relationships:

User
├── AuthIdentity
├── UserWallet
│ └── WalletTransaction
├── UserStreak
├── LifeCircleScore
└── UserDailyTask
└── UserTaskCompletion

---

# Authentication System

Support two authentication methods.

### Email Authentication

Email + password login.

Passwords must be hashed using **bcrypt**.

Endpoints:

POST /auth/register-email
POST /auth/login-email

---

### Phone Authentication

Phone number + OTP verification.

OTP rules:

- 6 digit numeric code
- Expires in 5 minutes
- Stored as hashed value
- Can only be used once

Endpoints:

POST /auth/send-otp
POST /auth/verify-otp

After authentication, return a **JWT access token**.

---

# Tasks MVP

The core feature of the app.

Each user receives **7 daily tasks**.

Tasks come from the **Task seed table**.

The selection algorithm should:

- Balance life parameters
- Avoid repeating recent tasks
- Mix difficulty levels

Task Levels:

1 → Micro
2 → Easy
3 → Moderate
4 → Hard
5 → Ultra

---

# Daily Task Assignment

Endpoint:

GET /tasks/today

Logic:

1. Check if tasks already exist for today
2. If yes → return them
3. If not → generate 7 tasks
4. Insert into user_daily_tasks
5. Return tasks

---

# Task Completion

Endpoint:

POST /tasks/:id/complete

Task completion must run inside a **single database transaction**.

Transaction steps:

1. Verify task is assigned to the user
2. Verify task is not already completed
3. Insert completion record
4. Update task status
5. Add points to wallet
6. Insert wallet transaction
7. Update streak
8. Update life circle score

If any step fails, the transaction must rollback.

---

# Wallet System

Each user has one wallet.

Wallet table:

- balance
- total_earned

Wallet transactions are **append-only**.

Transaction types:

- task_completion
- purchase
- deduction

Balance updates must always occur inside a database transaction.

---

# Streak System

Track daily consistency.

Rules:

- Completing at least 1 task per day increments streak
- Missing a day resets streak
- Track best streak

Fields:

- current_streak
- best_streak
- last_activity_date

---

# Life Circle System

Tracks personal development across parameters.

Parameters:

- awareness
- attention
- body
- emotional
- connection
- courage
- meaning

Each user has one row per parameter.

Scores range:

0 → 100

Scores increase when tasks are completed.

---

# Life Circle Decay Job

A scheduled job runs daily.

File:

jobs/decayJob.ts

Logic:

If a parameter has no activity for **7 days**, gradually decrease the score.

---

# Coding Standards

Follow these rules strictly.

General:

- Use async/await
- Avoid callback nesting
- Use Prisma transactions for multi-step updates
- Validate inputs with Zod

Naming:

- camelCase for variables
- PascalCase for classes
- snake_case for database fields

Error Handling:

Use centralized error responses.

Example:

```
{
  "success": false,
  "message": "Task already completed"
}
```

---

# Security Rules

Never store:

- plain passwords
- raw OTP values

Always hash using:

bcrypt

Rate-limit sensitive endpoints:

- login
- OTP
- task completion

---

# Expected Copilot Behavior

When generating code, Copilot should:

- Follow modular architecture
- Use Prisma for database access
- Validate input using Zod
- Use transactions for wallet updates
- Keep services stateless
- Write readable TypeScript code

Avoid:

- writing logic inside routers
- direct SQL queries
- duplicated business logic
- unsafe wallet updates

---

# Current Development Goal

Implement the **Tasks MVP backend** with the following modules:

1. Auth
2. Tasks
3. Wallet
4. Streak
5. Life Circle

The system should support:

- user registration/login
- daily task generation
- task completion
- reward system
- streak tracking
- life circle scoring
