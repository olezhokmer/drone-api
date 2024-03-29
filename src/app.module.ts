import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlgorithmModule } from './algorithm/algorithm.module';
import { GeometryModule } from './geometry/geometry.module';
import { FiguresModule } from './figures/figures.module';
import { GeoModule } from './geo/geo.module';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    AlgorithmModule,
    GeometryModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URL),
    FiguresModule,
    GeoModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
