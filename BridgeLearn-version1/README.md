# Adaptive E-Learning System (Multi-Terminal Monorepo Setup)

This project has been fully optimized to run either in the unified **AI Studio Live Preview Simulator** (multiplexing Student and Instructor dashboards together on Port 3000) or under **three completely independent terminals** for modular testing and isolated code execution.

---

## 🏗️ Monorepo Architecture

The monorepo organizes the systems into three separate, self-contained workspaces:

1. **/backend**
   - **Service**: Express API & real-time WebSocket Broadcast Server.
   - **Database**: Prisma SQLite ORM.
   - **Default Port**: `3000`

2. **/web-dashboard**
   - **Service**: Instructor panel built with React, Vite, Tailwind CSS, & Recharts.
   - **Default Port**: `3001`

3. **/student-app**
   - **Service**: Mobile student simulator interface built with React, Vite, Tailwind CSS, & motion.
   - **Default Port**: `3002`

---

## ⚙️ Running in Three Separate Terminals

To test the systems independently (just like you would in production), follow these instructions:

### Step 1: Install Dependencies
Open your main terminal at the root directory of this repository and run the monorepo helper installer:
```bash
npm run install:all
```
*This will automatically resolve and install dependencies across the core, backend, instructor web-dashboard, and student-app in one command.*

### Step 2: Open Terminal 1 — Start the Backend Server
Start the Express + WebSockets server:
```bash
npm run dev:backend
```
- **Service runs on**: `http://localhost:3000`
- **WS Server runs on**: `ws://localhost:3000`

### Step 3: Open Terminal 2 — Start the Instructor Web-Dashboard
Start the Vite developer build server for instructors:
```bash
npm run dev:instructor
```
- **Dashboard runs on**: `http://localhost:3001`
- **API Pointing to**: `http://localhost:3000`

### Step 4: Open Terminal 3 — Start the Student Application
Start the Vite developer build server for the student handset view:
```bash
npm run dev:student
```
- **Application runs on**: `http://localhost:3002`
- **API Pointing to**: `http://localhost:3000`
- **WebSockets Pointing to**: `ws://localhost:3000`

---

## ⚡ Adaptive & Resilient Capabilities Implemented

- **Dual-Mode Networking**: Both dashboards and students support toggling between **Online** and **Offline** modes.
- **Offline Quiz Syncer**: If the student answers a quiz while offline, response weights are saved to secure `localStorage` queues. Reconnecting to internet signal automatically starts a synchronization process which uploads logs and counts directly to the instructor's real-time charts!
- **Bandwidth Throttler Simulator**: Dragging the signal slider in the Student handset triggers real-time stream level changes (High 1080p stream ➡️ low 360p video ➡️ audio-only equalizer track ➡️ raw text-only lecture slide transcripts) to survive low bandwidth.
- **Bilingual Support**: Student interface easily toggles layout strings and dynamic caption translations between English (`en`) and French (`fr`).
