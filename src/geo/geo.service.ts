import { Injectable } from '@nestjs/common';
import * as mgrs from 'mgrs';
import { GeoCoordinates } from './dto/geoCoordinates.dto';
import { MgrsCoordinates } from './dto/mgrsCoordinates.dto';

@Injectable()
export class GeoService {
  parseToLatLon(mgrsCoordinate: string): GeoCoordinates {
    const [lat, lon] = mgrs.toPoint(mgrsCoordinate);

    return new GeoCoordinates(lat, lon);
  }

  convertMgrs(coordinates: MgrsCoordinates[]) {
    return coordinates.map((coord) => {
      const coords = coord.coordinates;
      const parsed = coords.map((mgrsCoord) => this.parseToLatLon(mgrsCoord));

      return {
        coordinates: parsed,
      };
    });
  }
}
