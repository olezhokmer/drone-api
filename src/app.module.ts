import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlgorithmModule } from './algorithm/algorithm.module';
import { GeometryModule } from './geometry/geometry.module';
import { FiguresModule } from './figures/figures.module';

@Module({
  imports: [
    AlgorithmModule,
    GeometryModule,
    ConfigModule.forRoot({ isGlobal: true }),
    FiguresModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
