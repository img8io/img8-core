/* eslint-disable prettier/prettier */
import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ipfs/:hash')
  async fetchData(@Param('hash') hash: string, @Query('auto') auto: string, @Query('w') w: number, @Query('h') h: number, @Res() res) {
    res.contentType('image/png');
    const imgRes = await this.appService.ipfs(hash, auto, w, h);
    res.send(Buffer.from(imgRes, 'binary'));
  }
}
