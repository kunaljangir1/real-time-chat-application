# Real-Time Chat Platform

A full-stack, responsive Real-Time Chat Application built using Node.js, Express, Socket.io, React, and MongoDB (Atlas Compatible).

## 🚀 Quick Start Guide

To run this application on any computer after cloning the repository, follow these precise configuration steps:

### 1. Install Dependencies
Run the installation in both the `client` and `server` directories from the root:
```bash
npm install --prefix client && npm install --prefix server
```
Or you can navigate directly:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables
Inside the `/server` directory, create a hidden file named exactly `.env`. Use the provided `.env.example` as a template and customize it:

```env
# /server/.env
PORT=5001
MONGO_URI=mongodb+srv://<your-username>:<your-password>@<your-cluster>.mongodb.net/realtime-chat
JWT_SECRET=your_super_secret_key_here
```
*(Make sure to replace `<your-username>`, `<your-password>`, and `<your-cluster>` with your actual MongoDB Atlas variables).*

### 3. Launch the Ecosystem
You don't need to run two separate terminals! Return to the root folder of this project and execute the master development command:
```bash
npm run dev
```

This will automatically boot **Concurrent Orchestration**:
- The **Express/MongoDB Backend** binding to your provided `PORT` (usually `5001`).
- The **Vite React Frontend** hosted on port `3000`.

## ✨ Professional Features

Your application contains enterprise-standard communication features:

- **Live Typing Indicators**: Real-time feedback when other participants are composing messages.
- **Sidebar Search & Filtering**: Instant search bar to navigate large lists of conversations and groups.
- **Unread Tab Notifications**: The browser tab title dynamically updates with an `(n) NeoChat` badge for missed messages.
- **Auth-Guard & Auto-Navigation**: Intelligent routing that skips login screens if you are already authenticated.
- **macOS Conflict Prevention**: Global infrastructure shifted to Port `5001` to prevent collisions with Apple AirPlay services.


### 🌍 Access over Local Network (LAN)
The Frontend application has been globally optimized to dynamically pull the API regardless of the Local Machine IP.
If you wish to test the Chat App on your mobile phone:
1. Look at your Terminal output to find your local IP (e.g. `http://192.168.1.XX:3000`).
2. Type that into Safari/Chrome on your phone.
3. Chat live between your Desktop and your Phone effortlessly!

## 📦 Containerization (Docker)
If you prefer isolated networking, you can completely ignore `.env` files and `npm install` requirements by launching our integrated containers! Ensure the Docker Engine is active, then run:
```bash
docker-compose up --build
```
