import { CoordinatesDto } from 'src/geometry/dto/coordinates.dto';

export class ChromosomeDto {
  constructor(angle: number, point: CoordinatesDto) {
    this.angle = angle;
    this.point = point;
  }
  angle: number;
  point: CoordinatesDto;
  tan: number;
}

export class ExtendedChromosome {
  start: ChromosomeDto;
  finish: ChromosomeDto;
}
