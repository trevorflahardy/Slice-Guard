from __future__ import annotations

__all__: tuple[str, ...] = (
    "Invalid3MFError",
    "AlreadyUnpackedError",
    "NotUnpackedError",
    "Unsliced3MFError",
)


class Invalid3MFError(Exception): ...


class AlreadyUnpackedError(Exception): ...


class NotUnpackedError(Exception): ...


class Unsliced3MFError(Exception): ...
