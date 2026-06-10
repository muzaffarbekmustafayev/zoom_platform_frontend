# Meetra — Frontend

The web client for Meetra. React 19, Vite 6, Tailwind CSS 4. Designed to feel like Zoom: dark room, clean dock, fast call setup.

## Features

**Calls** — mesh WebRTC via `simple-peer` with trickle ICE and configurable STUN/TURN; fast reconnect (peer diff — no full reconnect storm); camera & mic switching mid-call; audio chain (highpass → compressor → gain) with voice-activity highlighting (single shared `AudioContext`).

**Presentation**
- **Screen share as a separate stream** — your camera and mic keep working while you present; viewers see your face in the strip and the screen on stage.
- **File presentation** — open a **PDF / DOCX / TXT / PPTX** inside the app and present it page by page (rendered to a canvas stream, ←/→ to flip pages, floating page controls). No window juggling.
- **Permission model** — host/co-host present instantly and can take over; participants request approval from the host.
- **Stage control** — pin any tile (including yourself) onto the stage during a share, one click to return to the presentation. No mirror effect on shared content.

**Layout** — speaker view with a **left-side, top-to-bottom scrollable participant strip**; grid view with auto/1×1/2×2/3×3 sizes; mobile bottom strip.

**Collaboration** — chat (history, edit/delete, file attachments), participants panel with search and per-user moderation, hand raise, give-turn (spotlight), mute-all, recording (host, local `.webm` download).

**UX** — push-to-talk (hold Space / mic button), meeting timer, connection quality badge, uz/ru/en, light/dark themes, responsive (custom `xs` 480px and `tablet` 768px breakpoints, defined in `src/index.css` via `@theme` — Tailwind v4 does not read `tailwind.config.js` screens).

## Stack

- **React 19**, **Vite 6** (`@vitejs/plugin-react-swc`)
- **Tailwind CSS 4** (CSS-first config in `src/index.css`)
- **simple-peer** (WebRTC mesh) + **socket.io-client** (websocket-first)
- **pdfjs-dist**, **mammoth**, **jszip** — in-app document presentation
- **axios**, **react-router-dom 7**, **lucide-react**

## Run

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

## Environment

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Backend origin (default `http://localhost:5005`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_STUN_URL` | STUN server (default: Google STUN) |
| `VITE_TURN_URL` / `VITE_TURN_USERNAME` / `VITE_TURN_CREDENTIAL` | TURN relay — **required for reliable media across NATs/firewalls** |

## Structure

```text
src/
├── pages/
│   ├── RoomPage.jsx          # Call orchestration: peers, streams, share logic
│   ├── Dashboard.jsx         # Meetings, schedule, profile
│   ├── AuthPage.jsx          # Login / register / Google OAuth
│   └── AdminPage.jsx
├── components/
│   ├── Video.jsx             # Tile: tracks state, mirror (camera only), fullscreen
│   ├── ChatPanel.jsx
│   └── room/
│       ├── RoomVideoGrid.jsx         # Stage + left strip / grid layouts
│       ├── RoomDocShare.jsx          # PDF/DOCX/TXT/PPTX → canvas presentation
│       ├── RoomBottomControls.jsx    # Dock: mic/cam/share/file/record/...
│       ├── RoomParticipantsSidebar.jsx
│       ├── RoomHeader.jsx / RoomSettingsModal.jsx / RoomPasswordModal.jsx
│       └── RoomScreens.jsx
├── context/                  # Auth, theme+language, toasts
├── admin/                    # Admin dashboard widgets
└── api.js                    # Axios instance
```

## How sharing works (short)

1. Presenter's screen (`getDisplayMedia`) or document canvas (`canvas.captureStream`) is added to every peer as an **additional stream** (`peer.addStream`).
2. The server broadcasts `screen-sharing-started` with `screenStreamId`; receivers use it to classify incoming streams as camera vs screen.
3. Camera/mic streams are untouched — the presenter can talk and stay visible.
4. Permissions (`request-to-share` → host approval) and the single-presenter rule are enforced server-side.
