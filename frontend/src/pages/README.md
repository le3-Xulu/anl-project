# African Nations League — INF4001N Entrance Exam Project

A full-stack web application that simulates an African Nations League football tournament. Federations register their national teams (23 players with auto-generated ratings), an administrator runs the tournament bracket, and matches are played with AI-generated commentary or simulated instantly.

## Live Deployment

- **Frontend (Vercel):** https://anl-project-n3x0si6kt-african-nations-league.vercel.app
- **Backend (Render):** https://anl-backend-8rk2.onrender.com

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas (NoSQL) |
| Auth | JWT + bcrypt |
| AI Commentary | Google Gemini API |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Features

### Public (visitors)
- View the tournament bracket ("Road to the Final")
- View match summaries (with commentary if the match was "played", or score only if "simulated")
- View goal scorer leaderboard

### Federation Representative
- Sign up / log in
- Register a country (federation) with a manager name
- Auto-generated squad of 23 players with ratings:
  - Natural position: 50–100
  - Other positions: 0–50
- Country rating calculated as the average of the squad

### Administrator
- Start the tournament (requires 8 federations)
- Play matches with AI-generated commentary
- Simulate matches (instant result, no commentary)
- Restart tournament from Quarter Finals

## How to Run Locally

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)
- Google Gemini API key (free tier)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/le3-Xulu/anl-project.git
cd anl-project