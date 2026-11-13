import { IsBoolean } from 'class-validator';

export class ToggleStatusDto {
  @IsBoolean({ message: 'Trạng thái isActive phải là giá trị boolean' })
  isActive!: boolean;
}
