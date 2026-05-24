# 🎵 Soundrr

A self-hosted music request app — like Overseerr, but for music. Built to work with **Lidarr** and **Plex**.

## Features

- 🔍 Search for artists and albums via Lidarr's metadata
- 📬 Request system with admin approval workflow
- ✅ Auto-approve mode for trusted users
- 📊 Download queue monitoring (live from Lidarr)
- 🎧 Browse your Plex music library
- 👥 Multi-user with admin/user roles
- 🔒 JWT authentication

---

## Quick Start (Docker)

### 1. Clone / copy the project

```bash
git clone <your-repo> soundrr
cd soundrr
```

### 2. Set up environment

```bash
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
```

### 3. Launch

```bash
docker compose up -d --build
```

Soundrr will be available at **http://your-server-ip:5055**

### 4. First login

Default credentials: **admin / admin**

> ⚠️ Change this immediately after first login via user management.

---

## Configuration

Go to **Settings** (admin only) and configure:

### Lidarr
- **URL**: e.g. `http://192.168.1.100:8686`
- **API Key**: Lidarr → Settings → General → Security → API Key
- Click **Test Connection** to verify

### Plex
- **URL**: e.g. `http://192.168.1.100:32400`
- **Token**: Find at https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/
- Click **Test Connection** to verify

---

## Updating

```bash
docker compose pull
docker compose up -d --build
```

Data is stored in the `soundrr-data` Docker volume and persists across updates.

---

## Port / Reverse Proxy

Change the port in `.env`:
```
PORT=5055
```

For Nginx/Caddy reverse proxy, proxy to `http://localhost:5055`.

---

## Architecture

```
soundrr/
├── backend/          # Express.js API server
│   └── src/
│       ├── routes/   # auth, requests, lidarr, plex, settings
│       ├── services/ # lidarr.js, plex.js (API clients)
│       └── db/       # SQLite via better-sqlite3
├── frontend/         # React SPA
│   └── src/
│       ├── pages/    # Home, Search, Requests, Queue, Library, Settings
│       └── context/  # AuthContext
├── docker/           # nginx.conf
├── docker-compose.yml
└── .env.example
```
