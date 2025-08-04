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

## Database Schema

Complete schema files are provided under `slice-guard/backend/schema`. These
SQL files combine all migrations so a new database can be created without
running each migration individually.


# Developmental Preview Images

## Aug 4th Update

Updated print requests page - added filters, filtering, and tags (with colors) on requests. Updated light theme to be better on the eyes in dark-lit environments. Will work on implementing blob storage for user avatars both for development environments via Docker and production environments.

Coming next is actual an settings page. Following, websocket communication for channels with updates, updates for the client when an operation happens, and customizable channels.

<img width="1496" height="762" alt="image" src="https://github.com/user-attachments/assets/3910d694-5968-4996-bb18-aa7c0ab0078b" />
<img width="1480" height="751" alt="image" src="https://github.com/user-attachments/assets/a2a76d80-d596-4104-b77d-3ea763ef3b1b" />

## Jul 24th Update
Created and updated system for creating mock requests to start buildout of the print requests page. Will refine the page filters, filtering, etc in the coming updates. Goals are the following, for now:

- Ability to create and edit tags
- Ability to assign tags to requests
- Better UI for print request page
- Later: Dashboard for lab
- Lab settings page for admins
- Websocket channel communications and updates (*BIG one, very important)
- User settings page with actual avatars
- Channel creation, deletion, etc
- Lab request dashboard
- ...and many more, this is just on our minds for now.

<img width="1508" height="787" alt="image" src="https://github.com/user-attachments/assets/3970d420-825a-4d7f-82af-aac746bda40c" />

## Jul 23rd Update
<img width="1503" height="763" alt="image" src="https://github.com/user-attachments/assets/4c43791a-f4fa-4735-bd74-7d4892cd2199" />
<img width="1510" height="750" alt="image" src="https://github.com/user-attachments/assets/4067a3fe-8b9f-4caf-8a31-728311e90728" />

