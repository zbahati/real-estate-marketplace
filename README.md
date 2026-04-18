# Real Estate Backend (scaffold)

This is a minimal Express + PostgreSQL backend scaffold created to satisfy `TASK.md`.

Quick start

1. Change to the backend directory and copy `.env.example` to `.env`, then fill DB values:

```bash
cd backend
copy .env.example .env    # PowerShell/Windows
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm run start
# or for development with auto-reload
npm run dev
```

Health endpoint: `GET /health` (e.g. `http://localhost:3000/health`)
# Real Estate Marketplace App

A scalable SaaS marketplace for houses, land, and rentals built with:

- React Native (Expo)
- Node.js (Express)
- PostgreSQL
- Cloudinary
- Google Maps API

## Features
- Property listings
- Map-based search
- Authentication (JWT)
- Image uploads
- Favorites system

## Status
MVP in development

## Architecture
Follows modular backend + reusable mobile components