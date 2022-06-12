import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ipfs/:hash/:name?')
  async fetchDataWithName(
    @Res() res,
    @Param('hash') hash: string,
    @Query('r') r: string,
    @Query('t') t: string,
    @Param('name') name?: string,
    @Query('w') w?: number | string,
    @Query('h') h?: number | string,
    @Query('c') c?: string,
    @Query('flip') flip?: boolean,
    @Query('flop') flop?: boolean,
    @Query('b') b?: number | string
  ) {
    try {
      res.contentType('image/png');
      let imgRes;
      if (t && t === 'avatar') {
        imgRes = await this.appService.avatar(hash, name, w ? Number(w) : 500);
      } else {
        imgRes = await this.appService.ipfs(hash, name, r, w, h, c, flip, flop, b);
      }

      res.send(Buffer.from(imgRes, 'binary'));
    } catch (err) {
      Sentry.captureException(err);
      res.contentType('application/json');
      res.send({ error: err.message || err });
    }
  }
}
