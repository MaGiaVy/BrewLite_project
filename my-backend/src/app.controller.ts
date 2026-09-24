import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller('Hellomom')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('ty-gia')
  async getTyGia() {
    return await this.appService.layTyGiaHomNay();
  }
  @Get('thong-tin')
  getThongTin() {
    return {
      hoTen: 'Thanh Mã Nghi', // Trả về dạng dữ liệu JSON
      ngheNghiep: 'Kế toán',
      loiNhan: 'Đang học làm Backend!',
    };
  }
}
