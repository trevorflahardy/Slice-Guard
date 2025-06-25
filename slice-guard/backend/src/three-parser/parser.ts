import { mkdtemp, readFile, rm } from "fs/promises";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { spawn } from "child_process";
import { Plate, PlateMetadata } from "./plate";

/** Utility to parse <metadata key="" value=""/> blocks from a plate XML section */
function parseMetadataBlock(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /<metadata\s+key="([^"]+)"\s+value="([^"]+)"\s*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(block)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

/** Parse simple XML of the form `<plate>...</plate>` */
function parsePlates(xml: string): Record<string, string>[] {
  const plates: Record<string, string>[] = [];
  const plateRegex = /<plate[^>]*>([\s\S]*?)<\/plate>/g;
  let match: RegExpExecArray | null;
  while ((match = plateRegex.exec(xml)) !== null) {
    plates.push(parseMetadataBlock(match[1]));
  }
  return plates;
}

export class Parser {
  private tempDir: string | null = null;

  constructor(private filepath: string) {
    if (!existsSync(filepath)) {
      throw new Error(`File ${filepath} does not exist`);
    }
    if (!filepath.endsWith(".3mf")) {
      throw new Error("Only .3mf files are supported");
    }
  }

  /** Directory where files are unpacked */
  get temporaryDirectory(): string | null {
    return this.tempDir;
  }

  /** Unpack the 3MF archive to a temporary directory using the system unzip tool */
  async unpack(): Promise<void> {
    if (this.tempDir) {
      throw new Error("Archive already unpacked");
    }
    const dir = await mkdtemp(join(tmpdir(), "three-parser-"));
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("unzip", ["-qq", this.filepath, "-d", dir]);
      proc.on("error", reject);
      proc.on("exit", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`unzip failed with code ${code}`));
      });
    });
    this.tempDir = dir;
  }

  /** Remove the temporary directory */
  async cleanup(): Promise<void> {
    if (this.tempDir) {
      await rm(this.tempDir, { recursive: true, force: true });
      this.tempDir = null;
    }
  }

  /** Load the project settings JSON file */
  async getProjectSettings(): Promise<any> {
    if (!this.tempDir) throw new Error("Archive not unpacked");
    const path = join(this.tempDir, "Metadata", "project_settings.config");
    const data = await readFile(path, "utf8");
    return JSON.parse(data);
  }

  /** Internal helper to read an XML file and parse plates */
  private async loadPlatesFrom(file: string): Promise<Record<string, string>[]> {
    if (!this.tempDir) throw new Error("Archive not unpacked");
    const path = join(this.tempDir, "Metadata", file);
    const xml = await readFile(path, "utf8");
    return parsePlates(xml);
  }

  /** Extract plate metadata and return Plate instances */
  async extractPlates(): Promise<Plate[]> {
    const modelPlates = await this.loadPlatesFrom("model_settings.config");
    const slicePlates = await this.loadPlatesFrom("slice_info.config");

    const plates: Plate[] = [];
    for (const mp of modelPlates) {
      const slice = slicePlates.find((sp) => sp["index"] === mp["plater_id"]);
      if (!slice) continue;
      const combined: PlateMetadata = {
        ...mp,
        weight: slice["weight"],
        outside: slice["outside"],
        prediction: slice["prediction"],
      } as PlateMetadata;
      plates.push(new Plate(this, combined));
    }
    if (plates.length === 0) {
      throw new Error("No plates found in archive");
    }
    return plates;
  }
}

export default Parser;
