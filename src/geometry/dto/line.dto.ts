import { ChromosomeDto } from '../../algorithm/dto/chromosome.dto';
import { CoordinatesDto } from './coordinates.dto';

export class LineDto {
  constructor(start: CoordinatesDto, end: CoordinatesDto) {
    this.start = start;
    this.end = end;
  }
  start: CoordinatesDto;
  end: CoordinatesDto;
  intersected: number[];
  chromosome: ChromosomeDto;
}
