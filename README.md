# Code Names - Backend Service

Authoritative real-time Node.js and Socket.IO game server for Code Names multiplayer.

## About the Game

**Code Names** is a word-association deduction game between two teams: **Red** and **Blue**.
- **The Board:** A 5×5 grid of 25 word cards representing team agents, neutral bystanders, and one assassin.
- **Spymasters:** See the secret identities of all cards and give a one-word clue plus a number.
- **Operatives:** Work together to guess their team's cards based on the clue.
- **How to Win:** The first team to reveal all their agents wins. Uncovering the assassin card causes an immediate loss!

## Features

- Authoritative game logic: 25-word board generation, random first team (9 cards vs 8 cards), neutral cards (7), and assassin (1).
- Information security: Operatives receive only revealed cards; full answer keys are masked by the server and only delivered to verified Spymasters.
- Room lifecycle management: Room creation, joining, team/role assignments, host authorization, readiness checks, and clean disconnect/reconnect handling.
- Input validation: Turn enforcement, phase enforcement, valid clue and count verification.
- Health check endpoint (`GET /health`) for deployment monitoring.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env`:
   ```env
   PORT=3001
   CLIENT_URL=http://localhost:3000
   ```

3. **Run in development / production:**
   ```bash
   npm start
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the server listens on | `3001` |
| `CLIENT_URL` | Allowed CORS origin for frontend | `*` |

## Deployment Notes

- **Hosting platforms:** Ready for Render, Railway, Fly.io, or VPS.
- **In-Memory State Notice:** Active room states are stored in memory for low latency. If deploying multiple instances, ensure sticky sessions or run on a single container instance unless an external Pub/Sub adapter (e.g. Redis) is added in the future.
