# 🎨 CollabDraw — Real-Time Collaborative Drawing App

> A full-stack, production-grade Excalidraw clone featuring real-time multi-user canvas collaboration via WebSockets, JWT authentication, and a Turborepo-powered monorepo architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-ws-010101?style=flat&logo=socketdotio)](https://github.com/websockets/ws)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=flat&logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-EF4444?style=flat&logo=turborepo)](https://turbo.build/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220?style=flat&logo=pnpm)](https://pnpm.io/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [WebSocket Protocol](#-websocket-protocol)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [Design Decisions](#-design-decisions)

---

## 🔍 Overview

CollabDraw is a real-time collaborative whiteboard application built from first principles. Multiple users can join the same canvas room, draw shapes simultaneously, and see each other's changes reflected live — all without page refresh. The project demonstrates a solid understanding of WebSocket communication, JWT-based stateless auth, monorepo architecture, and relational database design with Prisma ORM.

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure signup/signin with bcrypt password hashing and token-scoped access
- 🏠 **Canvas Rooms** — Create named rooms with a unique slug; room creator is automatically the admin
- 🔄 **Real-Time Collaboration** — Multiple users draw simultaneously via persistent WebSocket connections
- 🖼️ **Shape Support** — Rectangles, circles, lines, and freehand pencil strokes
- 🗑️ **Shape Deletion** — Delete shapes, synced across all connected collaborators in real time
- 💾 **Persistent Canvas** — All drawn elements are saved to PostgreSQL; canvas state is restored on rejoin
- 🚪 **Room Lifecycle** — Admin can close a room, which clears all data and notifies all participants
- 📦 **Monorepo** — Shared `common` types and `db` client across all apps via pnpm workspaces + Turborepo

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│            Next.js 16 App (port 3002)                           │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│   │  Auth Pages  │  │  Home / Room │  │  Canvas Component   │  │
│   │ /signup      │  │  Creation    │  │  HTML5 Canvas + WS  │  │
│   │ /signin      │  │              │  │                     │  │
│   └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘  │
└──────────┼────────────────┼──────────────────────┼─────────────┘
           │ HTTP (Axios)   │ HTTP (Axios)          │ WebSocket
           ▼                ▼                       ▼
┌──────────────────────┐         ┌───────────────────────────────┐
│  HTTP Backend        │         │  WebSocket Backend            │
│  Express.js          │         │  ws library (port 8080)       │
│  (port 3001)         │         │                               │
│                      │         │  In-memory user tracking:     │
│  POST /signup        │         │  users[] = { ws, rooms[], id }│
│  POST /signin        │         │                               │
│  POST /canvas-room   │         │  Events:                      │
│  GET  /canvas-room   │         │  → join_room / leave_room     │
│  GET  /elements/:id  │         │  → canvas_update              │
│  GET  /canvas-room-  │         │  → delete_shape               │
│       admin/:id      │         │  → close_room                 │
└──────────┬───────────┘         └───────────────┬───────────────┘
           │                                     │
           └──────────────┬──────────────────────┘
                          │ Prisma ORM
                          ▼
              ┌───────────────────────┐
              │   PostgreSQL Database  │
              │                       │
              │  User                 │
              │  CanvasRoom (Room)    │
              │  CanvasElement (Chat) │
              └───────────────────────┘
```

### Real-Time Data Flow

```
User A draws a shape
      │
      ▼
WS sends: { type: "canvas_update", room_id, elementData }
      │
      ▼
WS Server receives message
      ├─► Saves elementData to PostgreSQL (CanvasElement)
      └─► Broadcasts to all other users in same room
                │
                ▼
         User B & User C receive canvas_update → shape appears on their canvas
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16, React 19 | App Router, SSR/CSR pages |
| **Styling** | Tailwind CSS v4 | Utility-first responsive design |
| **HTTP Backend** | Express.js 5, Node.js | REST API, auth, room management |
| **WebSocket Server** | `ws` library, Node.js | Real-time bidirectional communication |
| **Database** | PostgreSQL | Persistent storage for users, rooms, elements |
| **ORM** | Prisma 7 | Type-safe database client, schema migrations |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt | Stateless auth, secure password storage |
| **Validation** | Zod (via `@repo/common`) | Shared runtime schema validation |
| **Monorepo** | Turborepo 2 + pnpm workspaces | Optimised builds, shared packages |
| **Language** | TypeScript (strict) | End-to-end type safety |

---

## 📁 Project Structure

```
excalidraw/                          ← Monorepo root
├── apps/
│   ├── excalidraw-frontend/         ← Next.js 16 frontend (port 3002)
│   │   ├── app/
│   │   │   ├── page.tsx             ← Home: room creation / join
│   │   │   ├── canvas/              ← Canvas room route
│   │   │   ├── signin/              ← Auth pages
│   │   │   └── signup/
│   │   ├── components/
│   │   │   ├── Canvas.tsx           ← Core drawing engine (HTML5 Canvas + WebSocket)
│   │   │   ├── RoomCanvas.tsx       ← Room-aware canvas wrapper
│   │   │   ├── RoomModal.tsx        ← Create / join room modal
│   │   │   └── AuthPage.tsx         ← Reusable auth form
│   │   └── draw/                    ← Drawing utility functions
│   │
│   ├── http-backend/                ← Express REST API (port 3001)
│   │   └── src/
│   │       ├── index.ts             ← Route definitions
│   │       ├── middleware.ts        ← JWT auth middleware
│   │       └── config.ts            ← Environment config
│   │
│   └── ws-backend/                  ← WebSocket server (port 8080)
│       └── src/
│           ├── index.ts             ← WS connection + message handlers
│           └── config.ts            ← Environment config
│
├── packages/
│   ├── db/                          ← Shared Prisma client
│   │   ├── prisma/schema.prisma     ← Database schema
│   │   └── src/                     ← Generated Prisma client + exports
│   ├── common/                      ← Shared Zod schemas & TypeScript types
│   ├── ui/                          ← Shared React component library
│   ├── eslint-config/               ← Shared ESLint config
│   └── typescript-config/           ← Shared tsconfig bases
│
├── turbo.json                       ← Turborepo pipeline configuration
├── pnpm-workspace.yaml              ← pnpm workspaces definition
└── package.json                     ← Root scripts
```

---

## 🗄️ Database Schema

```prisma
model User {
  id             String          @id @default(uuid())
  email          String          @unique
  password       String          // bcrypt hashed
  name           String
  photo          String?
  canvasRooms    CanvasRoom[]
  canvasElements CanvasElement[]
}

model CanvasRoom {
  id        Int             @id @default(autoincrement())
  slug      String          @unique   // human-readable room identifier
  createdAt DateTime        @default(now())
  adminId   String
  admin     User            @relation(fields: [adminId], references: [id])
  elements  CanvasElement[]

  @@map("Room")
}

model CanvasElement {
  id           Int        @id @default(autoincrement())
  elementData  String     // JSON-serialised shape data
  userId       String
  canvasRoomId Int
  canvasRoom   CanvasRoom @relation(fields: [canvasRoomId], references: [id])
  user         User       @relation(fields: [userId], references: [id])

  @@map("Chat")
}
```

---

## 🌐 API Reference

All protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/signup` | ❌ | Register a new user |
| `POST` | `/signin` | ❌ | Login and receive a JWT |

**POST `/signup`** body:
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```

**POST `/signin`** response:
```json
{ "token": "<jwt>" }
```

### Canvas Rooms

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/canvas-room` | ✅ | Create a new canvas room with a slug |
| `GET`  | `/canvas-room/:slug` | ✅ | Resolve a room slug → numeric room ID |
| `GET`  | `/canvas-room-admin/:canvasRoomId` | ✅ | Check if current user is the room admin |
| `GET`  | `/elements/:canvasRoomId` | ✅ | Fetch last 50 canvas elements for a room |

---

## 🔌 WebSocket Protocol

Connect to `ws://localhost:8080?token=<jwt>`

The JWT is verified on connection establishment. Invalid tokens close the connection immediately (`1008 Policy Violation`).

### Client → Server Messages

#### Join a room
```json
{ "type": "join_room", "room_id": "42" }
```

#### Leave a room
```json
{ "type": "leave_room", "room_id": "42" }
```

#### Draw a shape
```json
{
  "type": "canvas_update",
  "room_id": "42",
  "elementData": "{\"type\":\"rect\",\"x\":100,\"y\":150,\"width\":200,\"height\":100}"
}
```

#### Delete a shape
```json
{
  "type": "delete_shape",
  "room_id": "42",
  "shapeId": "<shape-identifier>",
  "shape": { "type": "rect", "x": 100, "y": 150, "width": 200, "height": 100 }
}
```

#### Close a room (admin only)
```json
{ "type": "close_room", "room_id": "42" }
```

### Server → Client Messages

#### Incoming canvas update (from another user)
```json
{ "type": "canvas_update", "room_id": "42", "elementData": "...", "user_id": "..." }
```

#### Incoming delete (from another user)
```json
{ "type": "delete_shape", "room_id": "42", "shapeId": "..." }
```

#### Room has been closed by admin
```json
{ "type": "room_closed", "room_id": "42" }
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 9 — `npm install -g pnpm`
- **PostgreSQL** running locally (or a hosted instance)

### 1. Clone the repository

```bash
git clone https://github.com/mkmkumar282/excalidraw.git
cd excalidraw
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create `.env` files for each backend app. See the [Environment Variables](#-environment-variables) section below.

### 4. Run Prisma migrations

```bash
# From the repo root
pnpm --filter @repo/db exec prisma migrate dev --name init
```

### 5. Generate the Prisma client

```bash
pnpm --filter @repo/db exec prisma generate
```

### 6. Start all services

```bash
pnpm dev
```

This starts all three services concurrently via Turborepo:

| Service | URL |
|---|---|
| Frontend | http://localhost:3002 |
| HTTP Backend | http://localhost:3001 |
| WebSocket Server | ws://localhost:8080 |

---

## 🔑 Environment Variables

### `apps/http-backend/.env`

```env
DATABASE_URL="postgresql://username:password@localhost:5432/excalidraw?sslmode=disable"
JWT_SECRET="your_strong_jwt_secret_here"
```

### `apps/ws-backend/.env`

```env
JWT_SECRET="your_strong_jwt_secret_here"
DATABASE_URL="postgresql://username:password@localhost:5432/excalidraw?sslmode=disable"
```

> [!IMPORTANT]
> Both backends **must share the same `JWT_SECRET`** — the HTTP backend signs tokens and the WebSocket backend verifies them.

### `apps/excalidraw-frontend/.env.local` (optional)

```env
NEXT_PUBLIC_HTTP_BACKEND_URL="http://localhost:3001"
NEXT_PUBLIC_WS_BACKEND_URL="ws://localhost:8080"
```

---

## 💡 Design Decisions

### Why two separate backend services?

The HTTP backend and WebSocket server are intentionally split for clear **separation of concerns**:
- The HTTP backend handles stateless REST operations (auth, room CRUD) — easy to scale horizontally.
- The WebSocket server maintains persistent connections and in-memory user state — it is stateful by nature and benefits from being isolated.

### Why in-memory user tracking in the WS server?

A `users[]` array tracks active WebSocket connections mapped to their `user_id` and joined `rooms[]`. This avoids the overhead of a pub/sub broker (like Redis) for a single-instance server, while still enabling targeted broadcasts to all users in a specific room.

### Why is `elementData` stored as a JSON string vs. normalised columns?

Storing shape data as a serialised JSON string provides flexibility — new shape types can be added without schema migrations. The trade-off (no server-side queries on shape properties) is acceptable since shape filtering happens on the client.

### Shared `@repo/common` package

Zod schemas for request validation are defined once in `packages/common` and imported by both the HTTP backend (for validation) and the frontend (for type inference). This prevents type drift between client and server.

### Turborepo pipeline

Turborepo caches build outputs and only rebuilds packages that have changed. The `build` task in `turbo.json` enforces dependency order (`@repo/db` and `@repo/common` build before the app backends), preventing runtime import errors in production.

---

## 📝 License

MIT

---

*Built with ❤️ as a portfolio project demonstrating full-stack TypeScript, real-time systems, and monorepo architecture.*
