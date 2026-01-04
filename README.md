# AI Fitness Coach (React + Express)

Full-stack fitness app with **workout templates + workout logging**, **nutrition logging**, profile-based **calorie/macro targets**, progress charts, and **AI coach** features (weekly review + workout plan + meal plan).
Frontend: **React + Vite + Tailwind**. Backend: **Express + Prisma + PostgreSQL** + JWT auth. AI: **Groq (llama-3.3-70b-versatile)**.

## ✅ Key features

* **Auth:** register + login, JWT token stored in `localStorage` and sent as `Bearer`
* **Onboarding / Profile setup:** required fitness profile (gender/age/height/weight/activity/goal/training days)
  → without it, main pages are protected (auto redirect to `/profile/setup`)
* **Macro calculation (backend):** TDEE + target calories + P/F/C computed from the profile
* **Workouts**

  * **Workout templates:** create/list/delete templates (deletion blocked if logs exist)
  * **Workout logs:** save logs (sets: kg/reps/RIR), list with date filters, delete
* **Nutrition**

  * **Meal entries:** log meals (kcal + macros), list with date filters, daily totals, delete
* **Progress / Stats**

  * **/stats/overview:** daily macro/kcal aggregation, workouts/day, volume by muscle group (set count)
  * Frontend charts: **Recharts**
* **AI Coach (behind auth)**

  * **Weekly review** for a selected date range (default: last 7 days)
  * **Workout plan generator** (days/split/experience/notes)
  * **Meal plan generator** (meals/preferences/avoid/notes)
  * AI responses saved to DB (`AiFeedback`), last 20 returned

## 🧰 Requirements

* Node **18+**
* npm **9+**
* PostgreSQL (**14+ recommended**)
* (optional) Docker for Postgres

## 📦 Installation

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## 🔐 Environment variables

### Backend `.env` (backend root)

Create `backend/.env`:

```env
PORT=4000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/ai_fitness_coach?schema=public"
JWT_SECRET="change_me"
GROQ_API_KEY="your_groq_api_key"
```

### Frontend `.env` (frontend root)

```env
VITE_API_URL=http://localhost:4000
```

If not set, the frontend defaults to: `http://localhost:4000`.

## 🗄️ Database (Prisma + Postgres)

Backend uses PostgreSQL via Prisma (`DATABASE_URL`).

### Quick Postgres via Docker (optional)

```bash
docker run --name ai-fitness-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_fitness_coach \
  -p 5432:5432 \
  -d postgres:16
```

### Migrate / Prisma

```bash
cd backend
npx prisma migrate dev
# (if needed) npx prisma generate
```

## 🔧 API overview

Base URL: `http://localhost:4000`

### Public

```text
GET  /health
GET  /db-health
POST /auth/register   -> { token, user: { id, email } }
POST /auth/login      -> { token, user: { id, email } }
```

### Auth (requires Bearer token)

```text
GET    /profile/me
POST   /profile/upsert

GET    /workouts/templates
POST   /workouts/templates
DELETE /workouts/templates/:id

GET    /workouts/logs?from=YYYY-MM-DD&to=YYYY-MM-DD
POST   /workouts/logs
DELETE /workouts/logs/:id

GET    /nutrition/entries?from=YYYY-MM-DD&to=YYYY-MM-DD
POST   /nutrition/entries
DELETE /nutrition/entries/:id

GET    /stats/overview?from=YYYY-MM-DD&to=YYYY-MM-DD

POST   /ai/weekly-review
POST   /ai/workout-plan
POST   /ai/meal-plan
GET    /ai/feedbacks
```

## 🚀 Run (dev)

### 1) Backend

```bash
cd backend
npm run dev
# API: http://localhost:4000
```

### 2) Frontend

```bash
cd frontend
npm run dev
# Vite prints the local URL (usually http://localhost:5173)
```

## ℹ️ Notes

* Frontend routing / guards:

  * no token → redirect to `/login`
  * token exists but profile missing → redirect to `/profile/setup`
* Macro targets are computed on the backend from your profile.
* AI endpoints require **GROQ_API_KEY** (they will fail without it by design).

---

## 🧠 AI contribution

* This README was written from the project structure/code, **edited with AI assistance**.
* The project may include AI-generated UI/styling/text elements with manual fine-tuning.
