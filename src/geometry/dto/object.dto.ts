import { CoordinatesDto } from './coordinates.dto';

export class ObjectDto {
  constructor(coordinates: CoordinatesDto[]) {
    this.coordinates = coordinates;
  }
  coordinates: CoordinatesDto[];
}
