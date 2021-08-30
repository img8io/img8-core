/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

const IPFS = require('ipfs');
const all = require('it-all');
const uint8ArrayConcat = require('uint8arrays/concat');
const sharp = require('sharp');


@Injectable()
export class AppService {
  private node: any;

  async init() {
    if (!this.node) {
      this.node = await IPFS.create();
      const version = await this.node.version();
      console.log('Version:', version.version);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }

  async ipfs(hash: string, auto: string, w: number, h: number) {
    await this.init();

    const data = await all(this.node.cat(hash));
    const b = uint8ArrayConcat(data);
    const pngBuffer = await sharp(b)
      .rotate()
      .resize({ width: w ? Number(w) : null, height: h ? Number(h) : null, fit: 'inside', position: 'bottom', background: { r: 255, g: 255, b: 255, alpha: 0.5 } })
      .withMetadata()
      .png()
      .toBuffer()
    return pngBuffer;
  }
}
