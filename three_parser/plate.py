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

import os
from typing import TYPE_CHECKING

import aiofiles
import orjson

from .exceptions import NotUnpackedError

if TYPE_CHECKING:
    from .parser import Parser
    from .types.plate import Plate as PlateMetadataDict

__all__: tuple[str, ...] = ("Plate",)


class Plate:
    """Denotes a plate object that is contained in the sliced 3mf file.

    This object is used to represent a plate and grab metadata from the unzipped
    3mf file contents.

    At the moment, this class will only help you extract the relevant metadata
    that is needed for proper validation of the 3mf file for 3D printing in the
    Foundations of Engineering Lab Course at The University of South Florida.
    """

    __slots__: tuple[str, ...] = (
        "_parser",
        "plater_id",
        "plater_name",
        "locked",
        "gcode_file",
        "thumbnail_file",
        "top_file",
        "pick_file",
        "pattern_bbox_file",
        "weight",
        "outside",
        "prediction_seconds",
    )

    def __init__(
        self,
        *,
        parser: Parser,
        plater_id: str,
        plater_name: str,
        locked: str,
        gcode_file: str,
        thumbnail_file: str,
        top_file: str,
        pick_file: str,
        pattern_bbox_file: str,
        weight: str,
        outside: str,
        prediction: str,
    ) -> None:
        self._parser: Parser = parser
        self.plater_id: str = plater_id
        self.plater_name: str = plater_name
        self.locked: str = locked

        self.gcode_file: str = gcode_file  # ! TODO: G-code parsing

        self.thumbnail_file: str = thumbnail_file  # image file
        self.top_file: str = top_file  # image file
        self.pick_file: str = pick_file  # image file

        self.pattern_bbox_file: str = pattern_bbox_file  # bounding box information

        self.weight: float = float(weight)  # in grams
        self.outside: bool = bool(outside)
        self.prediction_seconds: float = float(prediction)  # in seconds (time of plate)

    def __repr__(self) -> str:
        return (
            f"<Plate plater_id={self.plater_id} "
            f"plater_name={self.plater_name} "
            f"locked={self.locked} "
            f"gcode_file={self.gcode_file} "
            f"thumbnail_file={self.thumbnail_file} "
            f"top_file={self.top_file} "
            f"pick_file={self.pick_file} "
            f"pattern_bbox_file={self.pattern_bbox_file} "
            f"weight={self.weight} "
            f"outside={self.outside} "
            f"prediction_seconds={self.prediction_seconds}>"
        )

    async def get_gcode_file(self) -> bytes | None:
        """|coro|

        Get the gcode file for the plate.

        Returns
        --------
        :class:`bytes`
            The gcode file for the plate.

        Raises
        ------
        NotUnpackedError
            The 3mf file has not been unpacked yet, so this image
            cannot be extracted.
        """
        if not self._parser.temporary_directory:
            raise NotUnpackedError

        path = os.path.join(self._parser.temporary_directory, self.gcode_file)
        if not os.path.exists(path):
            raise NotUnpackedError

        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def get_thumbnail_image(self) -> bytes | None:
        """|coro|

        Get the thumbnail image for the plate.

        Returns
        --------
        :class:`bytes`
            The thumbnail image for the plate.

        Raises
        ------
        NotUnpackedError
            The 3mf file has not been unpacked yet, so this image
            cannot be extracted.
        """
        if not self._parser.temporary_directory:
            raise NotUnpackedError

        path = os.path.join(self._parser.temporary_directory, self.thumbnail_file)
        if not os.path.exists(path):
            raise NotUnpackedError

        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def get_top_image(self) -> bytes | None:
        """|coro|

        Get the top image for the plate.

        Returns
        --------
        :class:`bytes`
            The top image for the plate.

        Raises
        ------
        NotUnpackedError
            The 3mf file has not been unpacked yet, so this image
            cannot be extracted.
        """
        if not self._parser.temporary_directory:
            raise NotUnpackedError

        path = os.path.join(self._parser.temporary_directory, self.top_file)
        if not os.path.exists(path):
            raise NotUnpackedError

        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def get_pick_image(self) -> bytes | None:
        """|coro|

        Get the pick image for the plate.

        Returns
        --------
        :class:`bytes`
            The pick image for the plate.

        Raises
        ------
        NotUnpackedError
            The 3mf file has not been unpacked yet, so this image
            cannot be extracted.
        """
        if not self._parser.temporary_directory:
            raise NotUnpackedError

        path = os.path.join(self._parser.temporary_directory, self.pick_file)
        if not os.path.exists(path):
            raise NotUnpackedError

        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def get_pattern_bbox_file(self) -> PlateMetadataDict | None:
        """|coro|

        Get the plate metadata for the plate.

        Returns
        --------
        :class:`dict`
            The plate metadata for the plate.

        Raises
        ------
        NotUnpackedError
            The 3mf file has not been unpacked yet, so this image
            cannot be extracted.
        """
        path = self.pattern_bbox_file
        if not path:
            raise NotUnpackedError

        async with aiofiles.open(path, "r") as f:
            content = await f.read()

        return orjson.loads(content)
