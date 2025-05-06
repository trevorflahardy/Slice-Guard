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
