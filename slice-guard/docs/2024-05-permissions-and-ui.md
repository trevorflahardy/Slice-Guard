# Permissions and UI Refactor Notes

## Backend

- Reworked `getMemberRolePermissions` to aggregate permissions from every role a member holds while still granting full access to lab owners. This fixes scenarios where secondary roles granted elevated permissions that were previously ignored.
- Added targeted WebSocket helpers to `State` so events can be delivered to specific users. Lab creation responses now use this path to avoid leaking newly created labs to every connected client.

## Frontend

- Lab permissions are recomputed directly from the active member record and refreshed whenever membership or roles change. This keeps permission-gated UI accurate after role edits.
- The lab member list now collapses on small screens and opens a detailed profile modal when a user is selected.
- Implemented a global user profile modal showing avatars, primary details, roles, and join dates with keyboard/overlay dismissal.
- Role management gained rank persistence through drag-and-drop, automatic rank recalculation, and real-time permission updates after edits or deletions.
- The color picker supports Hex, RGB, and HSL inputs with live synchronization and preview feedback.

## Components

- Added `UserProfileModal` for richer member inspection from both the sidebar and chat messages.
- Improved `ChannelMessage` to expose member profiles via avatar/name clicks while respecting context where a profile should not open.
- Updated `ColorPickerModal` to provide multi-format input controls alongside the existing color wheel preview.

These changes ensure lab ownership is respected, permissions remain consistent across the stack, and member management workflows are responsive on modern devices.
