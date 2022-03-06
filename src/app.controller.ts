import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ipfs/:hash')
  async fetchData(
    @Res() res,
    @Param('hash') hash: string,
    @Query('r') r: string,
    @Query('t') t: string,
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
        imgRes = await this.appService.avatar(hash, w ? Number(w) : 500);
      } else {
        imgRes = await this.appService.ipfs(hash, r, w, h, c, flip, flop, b);
      }

      res.send(Buffer.from(imgRes, 'binary'));
    } catch (err) {
      res.contentType('application/json');
      res.send({ error: err.message || err });
    }
  }
}
