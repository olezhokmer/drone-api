import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TaskDto } from '../algorithm/dto/task.dto';
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

  @Post()
  postFigures(@Body() body: TaskDto) {
    return this.geometryService.validateTaskAndGenerateObjects(body);
  }
}
