import { Injectable } from '@nestjs/common';
import { SuccessResponseDto } from '@repo/common';

@Injectable()
export class AppService {
  async checkSuccess(): Promise<SuccessResponseDto> {
    return { success: true };
  }
}
