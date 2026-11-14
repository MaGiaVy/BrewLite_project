import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreateProductDto,
  ToggleProductVisibilityDto,
  UpdateProductDto,
} from './dto/product.dto';
import { ProductsService } from './products.service';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}

export function extractUserFromRequest(
  req?: any,
): { role?: Role; [key: string]: any } | null {
  return req?.user ?? null;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Request() req?: any,
  ) {
    const user = extractUserFromRequest(req);
    const isAdmin = user?.role === Role.ADMIN;
    const isStaffOrAdmin =
      user?.role === Role.ADMIN || user?.role === Role.STAFF;

    // Chỉ cho phép includeInactive=true khi có quyền ADMIN/STAFF. Nếu là khách thường, luôn buộc showAll = false.
    const requestedShowAll =
      includeInactive === 'true' || includeInactive === '1';
    const showAll = isStaffOrAdmin ? requestedShowAll : false;

    return this.productsService.findAll(showAll, isAdmin);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req?: any,
  ) {
    const user = extractUserFromRequest(req);
    const isAdmin = user?.role === Role.ADMIN;
    return this.productsService.findOne(id, isAdmin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/visibility')
  toggleVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleProductVisibilityDto,
  ) {
    return this.productsService.toggleVisibility(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
