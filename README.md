# InfinityCompress 🚀

InfinityCompress is a cutting-edge universal file compression and format conversion platform built to completely skip the disk. Utilizing advanced **RAM-only pipelines**, it safely and intelligently shrinks massive graphical footprints down without ever touching your filesystem natively.

## 🏗️ Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, PyMuPDF (Documents), Pillow (Images)
- **Pipeline Architecture**: 100% In-Memory Buffer processing (`io.BytesIO`)

## ⚡ Features

1. **Upload Dashboard Core**: Supports drag-and-drop. Native `framer-motion` animations map standard OS processing cycles.
2. **Dynamic Format Selection API**: Users can actively enforce the conversion output format on images (`WEBP`, `JPEG`, `PNG`) using dynamic heuristics.
3. **Advanced PDF Pruning Engine**: Utilizes `fitz` PyMuPDF to cleanly scrub redundant metadata and aggressive recursive garbage routines from heavy documents.
4. **Dynamic Downloader**: Instant UUID-based router providing lightning-fast byte egress via direct stream access from the server's cache.

## 🏃‍♂️ Getting Started

### 1. Backend Server
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API running on `http://localhost:8000`

### 2. Frontend Interface
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
UI running on `http://localhost:3000`
