import { Module } from '@nestjs/common';
import { GeometryModule } from 'src/geometry/geometry.module';
import { AlgorithmService } from './algorithm.service';
import { AlgorithmController } from './algorithm.controller';

@Module({
  imports: [GeometryModule],
  providers: [AlgorithmService],
  controllers: [AlgorithmController],
})
export class AlgorithmModule {}
