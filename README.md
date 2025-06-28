[![wakatime](https://wakatime.com/badge/user/9e70bc6a-2430-4dc3-a452-4ec4d2a7a8b9/project/e65260a4-bd30-40cf-8b4e-ffe8366cb859.svg)](https://wakatime.com/badge/user/9e70bc6a-2430-4dc3-a452-4ec4d2a7a8b9/project/e65260a4-bd30-40cf-8b4e-ffe8366cb859)

-----

# SliceGuard


Welcome to Slice Guard, a tool to help University 3D-print labs manage requests for printing. Slice Guard is designed to keep track of students' 3D print requests, ensure they are within the allowed limits, and get useful statistics abotu your printers.

<img width="1512" alt="image" src="https://github.com/user-attachments/assets/479b8e0d-e288-4542-84e9-939d208968af" />

## Planned Features

- An easy system for students to request 3D print files for approval.
- A simple web, API, and GUI interface for students to submit their requests and for staff to approve or deny them.
- Logins, user management, and simple "teams" for staff to manage their students.
- Student submission history, total filament usage, and similar statistics.
- A simple way to track the status of 3D print requests.
- Detects invalid or improper requested 3D prints with:
  - A simple 3MF file parser that extracts all the needed information for you and informs you of any errors.
  - A simple GCode parser that extracts all the needed information for you and informs you of any errors.
  - A modern, clean GUI for staff to approve or deny requests, with notifications for students when their requests are approved or denied.
 - Concurrent file management between multiple users.

## REST API

All client interactions now use a simple REST API secured by per-user API keys.
When a user registers they receive a unique key which must be sent in the
`Authorization` header as `ApiKey <key>` for all subsequent requests.
Authentication and lab management endpoints formerly available over WebSockets
are now exposed via HTTP routes. Request creation and tagging have moved to REST
as well. Example endpoints:

- `POST /api/login` – exchange credentials for an API key
- `POST /api/register` – create a new user and receive an API key
- `GET /api/labs` – list labs for the authenticated user
- `POST /api/labs/:labId/requests` – submit a print request (base64 file upload)
- `GET /api/labs/:labId/requests` – list your requests for a lab

## File Storage

Uploaded 3MF files are stored on the backend under `slice-guard/backend/uploads`.
Files larger than 30MB are rejected. Each file is compressed using gzip to save
space and its path is stored in the database. For large scale deployments an
external storage service such as S3 is recommended, but for development local
storage is sufficient.

### Planned Technologies

- Docker for easy deployment and management.
- Bun for the backend + frontend.
- Vite as the build tool for the frontend.
  - Vue.js for the frontend.
  - Tailwind CSS for styling with a custom theme.
  - Pinia for state management (?)
  - Vue Router for routing.
- PostgreSQL for the database.
- Redis for caching and session management (?)

### Accent Scheme

The frontend uses a British Racing Green palette with a soft modern accent. `tailwind.config.cjs` defines CSS variables for a full light and dark theme:

- **main**: `#005e3c` (light) / `#1ba56e` (dark) – primary brand colour
- **accent**: `#30d158` – highlight and focus colour
- **accent-text**: black in light mode, white in dark mode
- **background** / **surface** – page and card backgrounds
- **foreground** / **muted** – primary and secondary text colours
- **border** – subtle lines and outlines
- **gray 1-3** – tiered neutral shades
- **success**, **warning**, **error**, **info** – status colours for UI components
- **white** and **black** remain handy shorthands

Dark mode is toggled by adding the `dark` class to the `<html>` element. Reusable UI pieces like `src/components/Button.vue` keep styles consistent across the app.

## Three Parser

The project now includes a TypeScript implementation of the 3MF parser located under `slice-guard/backend/src/three-parser`. It unpacks `.3mf` files using the system `unzip` utility and provides utilities for reading project settings and plate data.

```ts
import { Parser } from "./slice-guard/backend/src/three-parser";
const parser = new Parser("./tests/sliced_files/benchy_sliced.3mf");
await parser.unpack();
const plates = await parser.extractPlates();
console.log(plates[0].platerId);
await parser.cleanup();
```

The parser requires the `unzip` binary on the host system.

## Docker Setup

An example `compose.yaml` and `.env.example` are provided for local development.
After copying `.env.example` to `.env` you can build and start all services with:

```bash
docker compose up --build
```

The backend will be available on `http://localhost:3000` and the frontend on
`http://localhost:5173`. The frontend is configured to talk to the backend using
those internal addresses so WebSocket connections work out of the box.

