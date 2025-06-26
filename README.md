# SliceGuard

Welcome to Slice Guard, a tool to help University 3D-print labs manage requests for printing. Slice Guard is designed to keep track of students' 3D print requests, ensure they are within the allowed limits, and get useful statistics abotu your printers.

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

