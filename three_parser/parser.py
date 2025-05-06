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

import asyncio
import io
import os
from typing import TYPE_CHECKING, Any
import zipfile
import logging
import aiofiles
from aiofiles.tempfile import TemporaryDirectory as aiofiles_create_tempdir
from xml.etree import ElementTree as ET
import orjson

from .exceptions import AlreadyUnpackedError, NotUnpackedError, Unsliced3MFError
from .plate import Plate

if TYPE_CHECKING:
    from .types.project import ProjectSettings as ProjectSettingsDict

    # Due to the way that aiofiles works (which is horrible I might add), we
    # need a special encompass-all type for the temporary directory
    type AsyncTemporaryDirectory = Any


__all__: tuple[str, ...] = ("Parser",)

_log = logging.getLogger(__name__)
_log.setLevel(logging.DEBUG)


class Parser:
    def __init__(self, filepath: str) -> None:
        if not os.path.isfile(filepath):
            raise FileNotFoundError(f"File {filepath} does not exist")

        if not filepath.endswith(".3mf"):
            raise ValueError(f"File {filepath} is not a 3mf file")

        self._orig_filepath: str = filepath
        self._orig_filename: str = os.path.basename(filepath)

        # Denotes if the created temp directory is still valid (IE, can we
        # perform operations on it as the 3mf has been extracted)
        self._temp_dir: AsyncTemporaryDirectory | None = None

    async def __aenter__(self) -> Parser:
        if not self._temp_dir:
            await self.unpack()

        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_value: BaseException | None,
        traceback: object | None,
    ) -> None:
        if self._temp_dir:
            # Remove the temp directory
            await self._temp_dir.cleanup()
            self._temp_dir = None

        # If the temp directory is invalid, we don't need to do anything
        # here as nothing was created
        return

    @property
    def unpacked(self) -> bool:
        """:class:`bool`: Returns True if the 3mf file has been unpacked."""
        return bool(self._temp_dir)

    @property
    def temporary_directory(self) -> str | None:
        return self._temp_dir and self._temp_dir.name

    async def unpack(self) -> None:
        if self.unpacked:
            raise AlreadyUnpackedError(
                f"3mf file {self._orig_filepath} has already been unpacked, cannot unpack again"
            )

        # Unpack this 3mf file into a temporary directory
        self._temp_dir = await aiofiles_create_tempdir(
            suffix=self._orig_filename,
            prefix="3mf_",
        )

        async with aiofiles.open(self._orig_filepath, "rb") as f:
            zip_bytes = await f.read()

        # To avoid this operation being blocking, we're going to offload
        # this loading to a thread such that the main thread is not blocked
        # while we read the file
        def extract_all(zip_bytes: bytes, temp_dir: str) -> None:
            with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zip_file:
                zip_file.extractall(temp_dir)
                _log.debug(
                    "Extracted %s files to %s", len(zip_file.namelist()), temp_dir
                )

        # We need to use a thread to extract the files as the zipfile module
        await asyncio.to_thread(extract_all, zip_bytes, self._temp_dir.name)
        return

    async def get_project_settings(self) -> ProjectSettingsDict:
        """|coro|

        Extracts the project settings from the 3mf file.

        Returns
        --------
        dict[:class:`str`, Any]
            The project settings as a dictionary, unparsed.
        """

        if not self._temp_dir:
            # This has not been unpacked yet, so we cannot extract the project
            raise NotUnpackedError(
                f"3mf file {self._orig_filepath} has not been unpacked, cannot extract project settings"
            )

        # Read the project settings file
        project_settings_path = os.path.join(
            self._temp_dir.name, "Metadata", "project_settings.config"
        )

        async with aiofiles.open(project_settings_path, "r") as f:
            project_settings_bytes = await f.read()

        project_settings = orjson.loads(project_settings_bytes)
        _log.debug(
            "Extracted project settings from %s: %s",
            project_settings_path,
            project_settings,
        )

        return project_settings

    async def _load_model_settings(self) -> ET.ElementTree[ET.Element[str]]:
        """|coro|

        Loads the model settings from the 3mf file. Example of the model_settings.config file:

        .. code-block:: xml

            <?xml version="1.0" encoding="UTF-8"?>
            <config>
                <plate>
                    <metadata key="plater_id" value="1"/>
                    <metadata key="plater_name" value="Upload your File here"/>
                    <metadata key="locked" value="true"/>
                    <metadata key="gcode_file" value="Metadata/plate_1.gcode"/>
                    <metadata key="thumbnail_file" value="Metadata/plate_1.png"/>
                    <metadata key="top_file" value="Metadata/top_1.png"/>
                    <metadata key="pick_file" value="Metadata/pick_1.png"/>
                    <metadata key="pattern_bbox_file" value="Metadata/plate_1.json"/>
                </plate>
            </config>
        """
        if not self._temp_dir:
            # This has not been unpacked yet, so we cannot extract the project
            raise NotUnpackedError(
                f"3mf file {self._orig_filepath} has not been unpacked, cannot extract slice info"
            )

        path = os.path.join(self._temp_dir.name, "Metadata", "model_settings.config")
        async with aiofiles.open(path, "rb") as f:
            data_bytes = await f.read()

        _log.debug(
            "Extracted model settings from %s: %s",
            path,
            data_bytes.decode("utf-8", errors="replace"),
        )

        tree = ET.parse(io.BytesIO(data_bytes))
        return tree

    async def _load_slice_info(self) -> ET.ElementTree[ET.Element[str]]:
        """|coro|

        Loads the sliced information from the 3mf file. Example of the slice_info.config file:

        .. code-block:: xml

            <?xml version="1.0" encoding="UTF-8"?>
            <config>
            <header>
                <header_item key="X-BBL-Client-Type" value="slicer"/>
                <header_item key="X-BBL-Client-Version" value="01.08.04.51"/>
            </header>
            <plate>
                <metadata key="index" value="1"/>
                <metadata key="printer_model_id" value="Flashforge-Adventurer-5M"/>
                <metadata key="nozzle_diameters" value="0.4"/>
                <metadata key="timelapse_type" value="0"/>
                <metadata key="prediction" value="2124"/>
                <metadata key="weight" value="9.50"/>
                <metadata key="outside" value="false"/>
                <metadata key="support_used" value="false"/>
                <metadata key="label_object_enabled" value="true"/>
                <object identify_id="75" name="3DBenchy" skipped="false" />
                <filament id="1" type="PLA" color="#B3B3B3" used_m="3.18" used_g="9.50" />
                <warning msg="bed_temperature_too_high_than_filament" level="1" error_code ="1000C001"  />
            </plate>
            </config>
        """
        if not self._temp_dir:
            # This has not been unpacked yet, so we cannot extract the project
            raise NotUnpackedError(
                f"3mf file {self._orig_filepath} has not been unpacked, cannot extract slice info"
            )

        slice_info_path = os.path.join(
            self._temp_dir.name, "Metadata", "slice_info.config"
        )
        async with aiofiles.open(slice_info_path, "rb") as f:
            slice_info_bytes = await f.read()

        # Print the slice info bytes for debugging as a str
        _log.debug(
            "Extracted slice info from %s: %s",
            slice_info_path,
            slice_info_bytes.decode("utf-8", errors="replace"),
        )

        # Parse the slice_info.config file as XML
        tree = ET.parse(io.BytesIO(slice_info_bytes))
        return tree

    async def extract_plates(self) -> list[Plate]:
        """|coro|

        Extracts the plates from the 3mf file.

        Returns
        --------
        list[:class:`Plate`]
            A list of plates extracted from the 3mf file.

        Raises
        ------
        NotUnpackedError
            If the 3mf file has not been unpacked yet.
        Unsliced3MFError
            If the 3mf file does not contain any plates - IE, this is not a sliced
            3mf file.
        """
        if not self._temp_dir:
            # This has not been unpacked yet, so we cannot extract the project
            raise NotUnpackedError(
                f"3mf file {self._orig_filepath} has not been unpacked, cannot extract plates"
            )

        # Extract the slice_info.config file, parse it as an XML, then we can
        # grab the plate IDS from it for the plates
        # slice_info_tree = await self._load_slice_info()

        model_settings = await self._load_model_settings()
        slice_info = await self._load_slice_info()
        plates: list[Plate] = []

        metadata_keys = {
            "plater_id",
            "plater_name",
            "locked",
            "gcode_file",
            "thumbnail_file",
            "top_file",
            "pick_file",
            "pattern_bbox_file",
        }
        slice_info_keys = {"weight", "outside", "prediction"}

        # ! TODO: This is horrible inefficient, but honestly I don't care it works for now
        # ! and the user shouldn't have many plates anyway.
        for plate in model_settings.iter("plate"):
            plate_extracted: dict[str, str] = {}
            for metadata in plate.iter("metadata"):
                key = metadata.attrib["key"]
                if key in metadata_keys:
                    plate_extracted[key] = metadata.attrib["value"]

            # Find this plate in the slice_info.config file too, this is
            # a plate tag that has a metadata of "index" that matches the
            # plater_id of the model_settings.config file
            for plate_slice in slice_info.iter("plate"):
                index = plate_slice.find("metadata[@key='index']")
                if index is None:
                    continue

                index_value = index.attrib["value"]
                if index_value != plate_extracted["plater_id"]:
                    continue

                # Now we can extract the rest of the metadata from the slice_info.config
                for metadata in plate_slice.iter("metadata"):
                    key = metadata.attrib["key"]
                    if key in slice_info_keys:
                        plate_extracted[key] = metadata.attrib["value"]

            _log.debug(
                "Extracted plate metadata: %s",
                plate_extracted,
            )

            plate = Plate(parser=self, **plate_extracted)
            plates.append(plate)

        if not plates:
            raise Unsliced3MFError(
                "Given 3MF file that does not contain any plates, please check the file "
                "for geometry data."
            )

        return plates
