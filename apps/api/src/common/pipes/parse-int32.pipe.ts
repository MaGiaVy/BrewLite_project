import {
  ArgumentMetadata,
  BadRequestException,
  Inject,
  Injectable,
  Optional,
  PipeTransform,
} from '@nestjs/common';

const INT32_MAX = 2147483647;
export const PARSE_INT32_OPTIONS = 'PARSE_INT32_OPTIONS';

export interface ParseInt32Options {
  optional?: boolean;
  min?: number;
}

@Injectable()
export class ParseInt32Pipe implements PipeTransform<unknown, number | undefined> {
  private readonly optional: boolean;
  private readonly min: number;

  constructor(
    @Optional() @Inject(PARSE_INT32_OPTIONS) options: ParseInt32Options = {},
  ) {
    this.optional = Boolean(options?.optional);
    this.min = options?.min ?? 1;
  }

  transform(value: unknown, _metadata: ArgumentMetadata): number | undefined {
    if (value === undefined || value === null || value === '') {
      if (this.optional) {
        return undefined;
      }
      throw new BadRequestException('ID tham số bắt buộc phải là số nguyên dương hợp lệ');
    }

    const raw = typeof value === 'number' ? String(value) : String(value).trim();
    if (!/^-?\d+$/.test(raw)) {
      throw new BadRequestException('ID không đúng định dạng số nguyên');
    }

    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed < this.min || parsed > INT32_MAX) {
      throw new BadRequestException(
        `ID phải nằm trong khoảng số nguyên 32-bit hợp lệ (${this.min}..${INT32_MAX})`,
      );
    }

    return parsed;
  }
}
