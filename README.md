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

- **main**: `#004225` – primary brand colour
- **accent**: `#30d158` – highlight and focus colour
- **background** / **surface** – page and card backgrounds
- **foreground** / **muted** – primary and secondary text colours
- **border** – subtle lines and outlines
- **gray1-3** – tiered neutral shades
- **success**, **warning**, **error**, **info** – status colours for UI components
- **white** and **black** remain handy shorthands

Dark mode is toggled by adding the `dark` class to the `<html>` element.

## Three Parser

The Three parser is a simple Python implementation of a parser for the 3MF file format. It extracts all needed information from the 3MF file and converts it into neat objects. This parser is not complete and may not work for all 3MF files.

The core of the slice guard is being built beforehand and this parser will be ported to Bun later down the road. The goal is to have a simple way to test the parser and make sure it works as expected. Although a pyproject.toml file has been included, it is not a library yet and should not be used as such - this was only an easy way to keep track of dependencies and other formatting.

```python
from three_parser import Parser
import asyncio
import logging

_log = logging.getLogger(__name__)
_log.setLevel(logging.DEBUG)


async def main():
    logging.basicConfig(level=logging.DEBUG)

    async with Parser("./tests/sliced_files/benchy_sliced.3mf") as parser:
        plates = await parser.extract_plates()
        print(plates)

        for plate in plates:
            contents = await plate.get_gcode_file()
            print(contents and next(iter(contents.splitlines())).decode("utf-8"))
            print(plate.prediction_seconds)


asyncio.run(main())
```
