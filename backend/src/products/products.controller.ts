import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { GetProductsQueryDto } from './dto/get-products-query.dto.js';

@Controller(['products', 'api/v1/products'])
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getProducts(@Query() query: GetProductsQueryDto) {
    const data = await this.productsService.findAll(query);
    return {
      statusCode: 200,
      message: 'Lấy danh sách sản phẩm thành công',
      data,
    };
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const data = await this.productsService.findOne(id);
    return {
      statusCode: 200,
      message: 'Lấy chi tiết sản phẩm thành công',
      data,
    };
  }
}
