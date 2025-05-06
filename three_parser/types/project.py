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

from typing import Any, TypedDict


class ProjectFilamentSettings(TypedDict):
    filament_flow_ratio: list[str]  # list of float-like strings
    filament_type: list[str]  # list of filament types (PLA)
    filament_flow_ratio: list[str]  # list of float-like strings
    filament_diameter: list[str]  # list of float-like strings
    filament_density: list[str]  # list of float-like strings
    filament_max_volumetric_speed: list[str]  # list of float-like strings


class InitialLayerSettings(TypedDict):
    initial_layer_acceleration: str  # int-like string
    initial_layer_infill_speed: str  # int-like string
    initial_layer_line_width: str  # float-like string
    initial_layer_travel_speed: str  # percentage string
    initial_layer_speed: str  # int-like string


class NozzleSettings(TypedDict):
    nozzle_diameter: list[str]  # list of float-like strings
    nozzle_temperature: list[str]  # list of float-like strings
    nozzle_temperature_initial_layer: list[str]  # list of int-like strings
    nozzle_temperature_range_high: list[str]  # list of int-like strings
    nozzle_temperature_range_low: list[str]  # list of int-like strings


class PrinterSettings(TypedDict):
    printer_model: str
    printer_settings_id: str


class GeneralProjectSettings(TypedDict): ...


type ProjectSettings = (
    ProjectFilamentSettings
    | InitialLayerSettings
    | NozzleSettings
    | PrinterSettings
    | dict[str, Any]
)
