import { readFile } from 'fs/promises';
import { join } from 'path';
import Parser from './parser';

export interface PlateMetadata {
  plater_id: string;
  plater_name: string;
  locked: string;
  gcode_file: string;
  thumbnail_file: string;
  top_file: string;
  pick_file: string;
  pattern_bbox_file: string;
  weight: string;
  outside: string;
  prediction: string;
}

export class Plate {
  constructor(
    private parser: Parser,
    private meta: PlateMetadata,
  ) {}

  get platerId() {
    return this.meta.plater_id;
  }
  get platerName() {
    return this.meta.plater_name;
  }
  get weight() {
    return parseFloat(this.meta.weight);
  }
  get predictionSeconds() {
    return parseFloat(this.meta.prediction);
  }

  private async readFileRelative(pathName: string): Promise<Buffer> {
    if (!this.parser.temporaryDirectory) {
      throw new Error('Parser not unpacked');
    }
    const full = join(this.parser.temporaryDirectory, pathName);
    return await readFile(full);
  }

  async getGcode(): Promise<Buffer> {
    return this.readFileRelative(this.meta.gcode_file);
  }

  async getThumbnail(): Promise<Buffer> {
    return this.readFileRelative(this.meta.thumbnail_file);
  }

  async getTopImage(): Promise<Buffer> {
    return this.readFileRelative(this.meta.top_file);
  }

  async getPickImage(): Promise<Buffer> {
    return this.readFileRelative(this.meta.pick_file);
  }

  async getPatternBBox(): Promise<any> {
    const buf = await this.readFileRelative(this.meta.pattern_bbox_file);
    return JSON.parse(buf.toString('utf8'));
  }
}

export default Plate;
