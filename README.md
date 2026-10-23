# The Raptor Nest

LASA's student information hub: announcements, club news, upcoming dates, a personal to-do list, and shared class notes in one place. Built by Clint Lee and Shaoyu Wang for the 2026 Congressional App Challenge (originally "Study Hub").

## Running it

| Command | What it runs |
| --- | --- |
| `npm run demo` | **Demo build**: no login, no server, no keys. Sample LASA data lives in your browser. |
| `npm run start` | **Real app**: Supabase login + database, plus the Express server. Needs `client/.env` and `server/.env`. |
| `npm run build:demo` | Static demo site in `client/dist/` (for hosting the CAC demo) |

Before using new hub features in the real app, run `server/sql/2026-10-raptor-nest-hub.sql` once in the Supabase SQL editor (adds bulletin categories/events/pinning and the `todos` table).

School-specific settings (name, A/B schedule, post categories) live in `client/src/lib/school.ts`; logos are in `client/public/brand/`.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express
- TypeScript
- Supabase

---

## Features

Planned features:

- Simple note sharing system, nothing extra
- Notes are categorized by school subject
- Sign-in/basic account system for privacy and security
- Basic search

To-do:

- [x] Upload notes
- [x] Backend and database interaction
- [x] Individual note pages
- [x] Upload and host files
- [x] Search function
- [x] Organize notes in explore by topic
- [x] Account page
- [x] User authentication
- [x] Polished web frontend, light/dark mode
- [ ] Bulletin page for club ads and announcements
- [ ] An advanced search implementation
- [ ] Mobile frontend
- [ ] Moderation

---

## Project Structure

```txt
study-hub/
├── server/          # Express backend
│   └── src/
│       └── index.ts
│
├── src/             # React frontend
│   ├── components/
│   ├── pages/
│   └── App.tsx
│
├── public/
└── package.json
```

---

## Getting Started

Because this project runs on React, it uses the Vite development tool to build and bundle files.

### Clone the repo

```bash
git clone https://github.com/shaoyuwang119/study-hub
```

Or use the VSC git GUI.

### Install dependencies

Frontend:

```bash
npm install
```

Backend:

```bash
cd server
npm install
```

---

## Running the Project

From the root folder:

```bash
npm run start
```

This will get Vite to build the project and host the client at port `5173` by default.

Frontend:

```txt
http://localhost:5173
```

Backend:

```txt
http://localhost:3000
```

---

## API Routes

### Get Notes

API Location:

```txt
http://localhost:3000/api/notes
```

Get Notes:

```txt
GET /api/notes
```

Example response:

```json
[
  {
    "id": 1,
    "title": "AP Chemistry Notes",
    "author": "Shaoyu",
    "url": "https://placehold.co/600x400"
  }
]
```

---

## Goals

This project is intended as:

- a learning experience for full-stack development
- a platform for collaborative studying
- a portfolio project

---

## Future Ideas

- Flashcard generation
- OCR for handwritten notes
- Personalized recommendations
- Comments and ratings
