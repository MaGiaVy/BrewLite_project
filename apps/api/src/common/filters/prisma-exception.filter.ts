import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi cơ sở dữ liệu';

    if (exception.code === 'P2002') {
      status = HttpStatus.CONFLICT;
      message = 'Dữ liệu đã tồn tại';
    } else if (exception.code === 'P2025') {
      status = HttpStatus.NOT_FOUND;
      message = 'Không tìm thấy bản ghi yêu cầu';
    } else if (exception.code === 'P2003' || exception.code === 'P2023') {
      status = HttpStatus.BAD_REQUEST;
      message = 'Tham số hoặc khóa tham chiếu không hợp lệ';
    } else if (
      /out of range|22003|22P02|INT4|Unable to fit integer/i.test(exception.message)
    ) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Giá trị số vượt quá giới hạn cho phép';
    }

    res.status(status).json({
      statusCode: status,
      message,
      error: status === 400 ? 'Bad Request' : status === 409 ? 'Conflict' : status === 404 ? 'Not Found' : 'Internal Server Error',
    });
  }
}
