import { Injectable } from '@nestjs/common';
import { CID } from 'multiformats';
import { base16 } from 'multiformats/bases/base16';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';
import * as Sentry from '@sentry/node';

const IPFS = require('ipfs-core');
const all = require('it-all');
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

  async avatar(hash: string, name: string, w: number) {
    try {
      await this.init();

      if (hash.startsWith('f') || hash.startsWith('F')) {
        hash = CID.parse(hash, base16).toString();
      }
      const data = await all(this.node.cat(!name ? hash : `/ipfs/${hash}/${name}`));
      const buff = uint8ArrayConcat(data);

      const r = w / 2;
      const circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);

      const webpBuffer = await sharp(buff)
        .resize(w, w)
        .composite([
          {
            input: circleShape,
            blend: 'dest-in'
          }
        ])
        .webp()
        .toBuffer();
      return webpBuffer;
    } catch (err) {
      const errMsg = `avatar - error to process the image of ${hash}, error msg: ${err.message || err}`
      Sentry.captureException(errMsg);
      return Promise.reject(err.message || err);
    }
  }

  /**
   * Returns the processed image back.
   *
   * @param hash The IPFS CID
   * @param name The file name under the IPFS cid
   * @param r Rotate the image with specified angle
   * @param w The width
   * @param h The height
   * @param c Composite image over the processed image
   * @param flip Flip the image about the vertical Y axis
   * @param flop Flop the image about the horizontal X axis
   * @param b Blur the image, if provided, performs a slower, more accurate Gaussian blur
   * @returns The final image buffer
   */
  async ipfs(
    hash: string,
    name: string,
    r: number | string,
    w: number | string,
    h: number | string,
    c: string,
    flip: boolean | string,
    flop: boolean | string,
    b: number | string
  ) {
    try {
      await this.init();

      if (hash.startsWith('f') || hash.startsWith('F')) {
        hash = CID.parse(hash, base16).toString();
      }

      const contentHash = !name ? hash : `/ipfs/${hash}/${name}`
      const data = await all(this.node.cat(contentHash));
      const buff = uint8ArrayConcat(data);

      const image = await sharp(buff);
      const md = await image.metadata();
      if (r) {
        image.rotate(Number(r));
      }

      if (flip || flip === 'true') {
        image.flip();
      }
      
      if (flop || flop === 'true') {
        image.flop();
      }

      image.resize({
        width: w ? Number(w) : null,
        height: h ? Number(h) : null,
      });

      if (b) {
        const blur = Number(b);
        if (blur < 0.3 || blur > 1000) {
          return Promise.reject('Invalid blur paratemer provided!');
        }
        image.blur(blur);
      }

      if (c) {
        const map = this.extractCompositeParameters(c);
        if (!map['cid']) {
          return Promise.reject('Invalid composite paratemers provided!');
        }

        try {
          await this.composite(
            image,
            Math.round(md.width / 2),
            Math.round(md.height / 2),
            map['cid'],
            map['g'] ? map['g'] : 'southeast'
          );
        } catch (error) {
          console.error(
            'Error to composite the image of',
            map['cid'],
            'error msg:',
            error.message || error
          );
          Sentry.captureException(error);
          throw Error(error.message || error);
        }
      }

      // return the png type buffer
      return await image.withMetadata().png().toBuffer();
    } catch (err) {
      const errMsg = `ipfs - error to process the image of ${hash}, error msg: ${err.message || err}`
      Sentry.captureException(errMsg);
      return Promise.reject(err.message || err);
    }
  }

  private extractCompositeParameters(c: string) {
    const arr = c.split(',');
    const result = {};
    arr.forEach((item) => {
      const val = item ? item.trim().split('=') : [];
      if (val.length > 0) {
        result[val[0]] = val[1];
      }
    });

    return result;
  }

  private async composite(
    image: any,
    w: number,
    h: number,
    cid: string,
    g: string
  ) {
    try {
      if (cid.startsWith('f') || cid.startsWith('F')) {
        cid = CID.parse(cid, base16).toString();
      }
      const data = await all(this.node.cat(cid));
      const ub = uint8ArrayConcat(data);
      const nestedImage = await sharp(ub);
      nestedImage.resize(w, h);
      const buff = await nestedImage.toBuffer();
      image.composite([{ input: buff, gravity: g }]);
    } catch (err) {
      throw err;
    }
  }
}
