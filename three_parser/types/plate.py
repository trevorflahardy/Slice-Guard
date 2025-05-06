"""
Contributor-Only License v1.0

This file is licensed under the Contributor-Only License. Usage is restricted to
non-commercial purposes. Distribution, sublicensing, and sharing of this file
are prohibited except by the original owner.

Modifications are allowed solely for contributing purposes and must not
misrepresent the original material. This license does not grant any
patent rights or trademark rights.

Full license terms are available in the LICENSE file at the root of the repository.
"""

from __future__ import annotations

from typing import TypedDict

type BoundBox = list[float]


class BoundBoxObject(TypedDict):
    area: float
    bbox: BoundBox
    id: int
    layer_height: float
    name: str


class Plate(TypedDict):
    bbox_all: BoundBox
    bbox_objects: list[BoundBoxObject]
    bed_type: str
    filament_colors: list[str]  # list of hex colors
    filament_ids: list[int]  # list of filament IDs on this plate
    first_extruder: int
    is_seq_print: bool
    nozzle_diameter: float
    version: int
