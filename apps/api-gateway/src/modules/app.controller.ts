import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SuccessResponseDto } from '@repo/common';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async checkSuccess(): Promise<SuccessResponseDto> {
    return this.appService.checkSuccess();
  }
}
