import { Module } from '@nestjs/common';
import { GeometryModule } from 'src/geometry/geometry.module';
import { FiguresController } from './figures.controller';

@Module({
  imports: [GeometryModule],
  controllers: [FiguresController],
})
export class FiguresModule {}
