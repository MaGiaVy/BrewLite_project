import { IsOptional, IsString } from 'class-validator';

export class GetProductsQueryDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
