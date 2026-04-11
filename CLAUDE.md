# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

This is a Bachelor of AI graduation project (IAU, ARTI 521) — a real-time accident detection system. It has two distinct components:

1. **ML Notebooks** (`/` root) — Google Colab Pro pipeline (Python, T4 GPU)
2. **GUI** (`/GUI/`) — React/TypeScript dispatcher dashboard (Vite, runs locally)

---

## ML Notebooks

### Primary file
`GP_Emergency_Response_System.ipynb` — the unified merged notebook containing all 7 sections. The 5 individual source notebooks (`CADP_v2_EfficientNet_fixed.ipynb`, `Path1_VideoViT_v2.ipynb`, `Path2_ByteTrack_v5.ipynb`, `VLM_Triage_Qwen25_v2.ipynb`, `YOLOv11_Accident_Detection_Training2.ipynb`) are preserved as originals but the merged file is the working artifact.

### Notebook section map
| Section | Cells | Purpose |
|---|---|---|
| 0 — Environment | 01–02 | Combined installs + single Drive mount |
| 1 — Dataset Building | 03–08 | cls_dataset_v2 (10,313 frames) + TimeSformer clip splits |
| 2 — EfficientNet-B0 | 09–14 | Baseline frame classifier, ONNX export |
| 3 — YOLOv11 Classifier | 15–18 | Frame classifier via YOLO11s-cls |
| 4 — Path 1: TimeSformer | 19–24 | 8-frame video ViT, AMP training |
| 5 — Path 2: ByteTrack | 25–30 | Physics tracker, BH/s² collision detection |
| 6 — VLM Triage | 31–38 | Qwen2.5-VL-7B-AWQ triage JSON |
| 7 — Unified Pipeline | 39–42 | End-to-end orchestrator + benchmark |

### Critical constraints (do not reverse)
- **Runtime restart required** after Cell 01 (transformers/decord install)
- **VRAM swap at Cell 32**: TimeSformer (8–10 GB) must be deleted before loading Qwen (4.8 GB) — Cell 32 handles this
- **Cell 07**: TimeSformer negative loader must use all `.mp4` files — do NOT add `[:50]` truncation
- Model variable names are namespaced: `effnet_model`, `timesformer_model`, `yolo_cls_model`, `yolo_track_model`, `vlm_model` — never reuse the generic name `model`
- CADP label convention: frames 0–90 = normal, 91–104 = skip, 105+ = accident
- BH/s² (bbox-height-normalized velocity) is the collision threshold unit — never use raw px/s thresholds

### Key cache files (Google Drive: `program-memory/cache/`)
- `dataset_v2_complete.json` — canonical frame counts per split
- `videovit_splits_v2.json` — TimeSformer clip split manifest
- `train_history_v2.json`, `timesformer_v2_history.json` — training curves

### Checkpoints (Google Drive: `program-memory/checkpoints/`)
- `efficientnet_b0_v2_best.pt` — EfficientNet for Colab inference
- `efficientnet_b0_v2.onnx` — EfficientNet for Flask/non-PyTorch serving
- `timesformer_v2_best.pt` — primary accident detector (Path 1, F1=0.88)

---

## GUI (React Dashboard)

### Commands (run from `GUI/`)
```bash
npm install          # install dependencies
npm run dev          # dev server at http://localhost:3000
npm run build        # tsc + vite build → dist/
npm run lint         # ESLint (zero warnings policy)
npm run preview      # preview production build
npm run deploy       # build + gh-pages deploy
```

### Environment setup
Copy `.env.example` to `.env` and fill in Supabase credentials:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Without `.env`, the app will fail to authenticate — there is no offline mock fallback on the `main` branch.

### Branch state — important
`package.json` and `dataService.ts` contain **unresolved git merge conflict markers** between:
- `main` — uses `mockCameras`, `mockIncidents`, `mockUsers` from `dataService.ts` (no backend required)
- `feat/supabase-auth-and-database` — live Supabase integration, real auth, real incident data

`AuthContext.tsx` and `IncidentContext.tsx` are fully Supabase-integrated (no mock fallback). Resolve the conflicts in `package.json` and `dataService.ts` before running.

### Architecture

**Context provider hierarchy** (outermost → innermost):
```
ThemeProvider → NotificationProvider → AuthProvider → SystemProvider → IncidentProvider → Router
```
All providers must wrap the Router. `useAuth()`, `useIncidents()` etc. throw if called outside their provider.

**Routing model** — role-based, two user types:
- `admin` → `/admin/dashboard`, `/admin/cameras`, `/admin/users`, `/admin/audit`
- `responder` → `/responder/dashboard`, `/responder/incident/:id`, `/responder/archives`
- `ProtectedRoute` in `App.tsx` enforces role matching and redirects unauthenticated users to `/login`
- Router `basename` is `/Emergency-Response-Platform/` (GitHub Pages deployment path)

**Auth flow**: Supabase email/password → JWT session → `profiles` table lookup → `User` type with `role` field → stored in `AuthContext`. Session persisted via Supabase `onAuthStateChange` listener.

**Data flow**: Supabase queries live in context providers (`IncidentContext`, `SystemContext`). Contexts expose typed data + mutation functions. Components never call Supabase directly. `dataService.ts` is used only for `getSystemHealth()` and static mock data.

**Incident data shape**: Supabase rows are flat (snake_case). `mapRowToIncident()` in `IncidentContext.tsx` maps them to the nested `Incident` type with joined `incident_photos`, `action_logs`, `dispatched_units`, `collaboration_messages`.

### Design system
Dark mode only: base `#202a37`, cards `#323a45`, primary `#0071bc`, alert red `#e31c3d`, warning `#fdb81e`, success `#2e8540`. CSS custom properties used throughout — do not hardcode hex values in components.

### Demo credentials (mock/dev mode only)
- Admin: `admin@system.gov` / `password123`
- Responder: `responder@hospital.gov` / `password123`

### Python scripts (`GUI/python/`)
Utilities for finding live CCTV camera streams (TfL JamCam, YouTube, public DOT feeds). Independent of the main app — run standalone with `python main.py`. Requires `credentials.json` and `token.json` for Google Drive API access.
