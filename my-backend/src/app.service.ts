import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Xin chào, đây là backend đầu tiên của tui';
  }
  async layTyGiaHomNay() {
    // 1. Gọi API ngoại bộ
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();

    // 2. Bóc tách đúng tỷ giá VND từ kho dữ liệu khổng lồ
    const tyGiaVND = data.rates.VND;

    // 3. Đóng gói lại theo format nghiệp vụ riêng của hệ thống
    return {
      nghiepVu: 'Quy đổi ngoại tệ USD/VND',
      tyGiaHienTai: tyGiaVND,
      thongBao: 'Dữ liệu đã sẵn sàng để ghi nhận hạch toán',
    };
  }
}
