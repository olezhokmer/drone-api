import { Body, Controller, Get, Query } from '@nestjs/common';
import { GeometryService } from 'src/geometry/geometry.service';
import { GetFiguresDto } from './dto/getFigures.dto';

@Controller('figures')
export class FiguresController {
  constructor(private readonly geometryService: GeometryService) {}
  @Get()
  getFigures(@Query() query: GetFiguresDto) {
    return this.geometryService.generateQuadrilaterals(
      query.xMax,
      query.yMax,
      query.num,
    );
  }
}
