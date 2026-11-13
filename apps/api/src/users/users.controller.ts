import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { ToggleStatusDto } from '../common/dto/toggle-status.dto';
import { UsersService } from './users.service';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getAllStaff() {
    return this.usersService.getAllStaff();
  }

  @Get(':id')
  getStaffById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getStaffById(id);
  }

  @Post()
  createStaff(@Request() req: any, @Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto, req.user);
  }

  @Patch(':id')
  updateStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
    @Request() req: any,
  ) {
    return this.usersService.updateStaff(id, dto, req.user?.userId);
  }

  @Patch(':id/status')
  toggleStaffStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleStatusDto,
    @Request() req: any,
  ) {
    return this.usersService.toggleStaffStatus(id, dto.isActive, req.user?.userId);
  }

  @Delete(':id')
  deleteStaff(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.usersService.deleteStaff(id, req.user?.userId);
  }
}
