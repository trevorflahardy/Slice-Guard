# Three Parser (TypeScript)

This library parses sliced `3MF` archives produced by FlashPrint or
compatible slicers. It extracts plate metadata and project settings so the backend
can validate uploaded print jobs.

The parser works by unpacking the `.3mf` file to a temporary directory using the
system `unzip` utility. After unpacking you may access project settings and plate
information. Temporary files are cleaned up when `cleanup()` is called.

```ts
import { Parser } from "../three-parser";

const parser = new Parser("path/to/file.3mf");
await parser.unpack();
const plates = await parser.extractPlates();
console.log(plates[0].platerId);
await parser.cleanup();
```

> **Note**
> The parser relies on the `unzip` binary being available on the host system.
