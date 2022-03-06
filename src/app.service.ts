import { Injectable } from '@nestjs/common';
import { concat as uint8ArrayConcat } from 'uint8arrays/concat';

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

  async avatar(hash: string, w: number) {
    await this.init();

    const data = await all(this.node.cat(hash));
    const buff = uint8ArrayConcat(data);

    const r = w / 2;
    const circleShape = Buffer.from(
      `<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`
    );

    const webpBuffer = sharp(buff)
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
  }

  /**
   * Returns the processed image back.
   *
   * @param hash The IPFS CID
   * @param auto
   * @param w The width
   * @param h The height
   * @param c Composite image(s) over the processed image
   * @param flip Flip the image about the vertical Y axis
   * @param flop Flop the image about the horizontal X axis
   * @param b Blur the image, if provided, performs a slower, more accurate Gaussian blur
   * @returns The final image buffer
   */
  async ipfs(
    hash: string,
    auto: string,
    r: string,
    w: number | string,
    h: number | string,
    c: string,
    flip: boolean,
    flop: boolean,
    b: number | string
  ) {
    try {
      await this.init();

      const data = await all(this.node.cat(hash));
      const buff = uint8ArrayConcat(data);

      const image = await sharp(buff);
      const md = await image.metadata();
      if (r) {
        image.rotate(Number(r));
      }

      if (flip) {
        image.flip();
      }

      if (flop) {
        image.flop();
      }

      image.resize({
        width: w ? Number(w) : null,
        height: h ? Number(h) : null,
        fit: 'inside',
        position: 'bottom'
      });

      if (b) {
        image.blur(Number(b));
      }

      if (c) {
        const map = this.extractCompositeParameters(c);
        if (!map['cid']) {
          return Promise.reject('Wrong composite paratemers provided!');
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
          throw Error(error.message || error);
        }
      }

      // return the png type buffer
      return await image.withMetadata().png().toBuffer();
    } catch (err) {
      console.error(
        'Error to process the image of',
        hash,
        'error msg:',
        err.message || err
      );
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
