import { BadRequestException, Injectable } from '@nestjs/common';
import { ChromosomeDto } from 'src/algorithm/dto/chromosome.dto';
import { TaskDto } from 'src/algorithm/dto/task.dto';
import { CoordinatesDto } from './dto/coordinates.dto';
import { LineDto } from './dto/line.dto';
import { ObjectDto } from './dto/object.dto';
import { Orientation } from './enum/orientation.enum';

@Injectable()
export class GeometryService {
  private areaSizeReducer: number;
  private objectPointsNumber: number;
  private maxAngle: number;
  private neighborAngle: number;
  private neighborCoord: number;

  constructor() {
    this.areaSizeReducer = parseInt(process.env.AREA_SIZE_REDUCER);
    this.objectPointsNumber = parseInt(process.env.OBJECT_POINTS_NUMBER);
    this.maxAngle = parseFloat(process.env.MAX_ANGLE);
    this.neighborAngle = parseFloat(process.env.NEIGHBOR_ANGLE);
    this.neighborCoord = parseFloat(process.env.NEIGHBOR_COORD);
  }

  generateQuadrilaterals(
    xMax: number,
    yMax: number,
    quadrilateralsNumber: number,
  ): ObjectDto[] {
    const quadrilaterals: ObjectDto[] = [];

    while (quadrilaterals.length < quadrilateralsNumber) {
      const randomX = this.getRandomFloat(0, xMax);
      const randomY = this.getRandomFloat(0, yMax);

      const reducedX = randomX / this.areaSizeReducer;
      const reducedY = randomY / this.areaSizeReducer;

      let xLow = randomX - reducedX;

      if (xLow < 0) xLow = 0;

      let xTop = randomX + reducedX;

      if (xTop > xMax) xTop = xMax;

      let yLow = randomY - reducedY;

      if (yLow < 0) yLow = 0;

      let yTop = randomY + reducedY;

      if (yTop > yMax) yTop = yMax;

      const object = this.generateRandomObject(xLow, xTop, yLow, yTop);

      const permutations = this.permutate(object);

      const convex = permutations.find((permutation: ObjectDto) => {
        return this.isConvexQuadrilateral(permutation);
      });

      if (
        !convex ||
        !this.checkAngles(convex) ||
        quadrilaterals.some((figure) =>
          this.doesIntersectQuadrilateral(convex, figure),
        )
      )
        continue;

      quadrilaterals.push(convex);
    }

    return quadrilaterals;
  }

  validateTaskAndGenerateObjects(task: TaskDto): ObjectDto[] {
    const { objects, xMax, yMax } = task;

    const parsedObjects = objects.map((object, index) => {
      const id = (index + 1).toString();
      const isOutsideZone = object.coordinates.some(
        ({ x, y }) => x > xMax || x < 0 || y > yMax || y < 0,
      );

      if (isOutsideZone) {
        throw new BadRequestException(
          'Object ' + id + ' is outside the provided area.',
        );
      }

      const permutations = this.permutate(object);

      const convex = permutations.find((permutation: ObjectDto) => {
        return this.isConvexQuadrilateral(permutation);
      });

      if (!convex) {
        throw new BadRequestException('Object ' + id + ' is not convex.');
      }

      const other = objects.map((o, i) => (i != index ? o : null));

      const intersectionIndex = other.findIndex((figure) =>
        figure ? this.doesIntersectQuadrilateral(convex, figure) : false,
      );

      if (intersectionIndex != -1) {
        throw new BadRequestException(
          'Object ' +
            id +
            ' intersects object ' +
            (intersectionIndex + 1).toString(),
        );
      }

      return convex;
    });

    return parsedObjects;
  }

  generateRandomObject(
    xLow: number,
    xTop: number,
    yLow: number,
    yTop: number,
  ): ObjectDto {
    const points: CoordinatesDto[] = Array.from(
      { length: this.objectPointsNumber },
      () => {
        const x = this.getRandomFloat(xLow, xTop);
        const y = this.getRandomFloat(yLow, yTop);
        return new CoordinatesDto(x, y);
      },
    );

    return new ObjectDto(points);
  }

  isConvexQuadrilateral(object: ObjectDto): boolean {
    const coords = object.coordinates;

    if (coords.length != this.objectPointsNumber) {
      return false;
    }

    const multiplies: number[] = [];

    for (let i = 0; i < this.objectPointsNumber; i++) {
      const start = coords.at(i);
      const firstVecorCoord = coords.at(
        (i - 1 + this.objectPointsNumber) % this.objectPointsNumber,
      );
      const secondVectorCoord = coords.at((i + 1) % this.objectPointsNumber);

      const firstVector = new CoordinatesDto(
        start.x - firstVecorCoord.x,
        start.y - firstVecorCoord.y,
      );

      const secondVector = new CoordinatesDto(
        secondVectorCoord.x - start.x,
        secondVectorCoord.y - start.y,
      );

      const multiply =
        firstVector.x * secondVector.y - firstVector.y * secondVector.x;

      multiplies.push(multiply);
    }

    if (multiplies.every((m) => m > 0) || multiplies.every((m) => m < 0)) {
      return true;
    } else {
      return false;
    }
  }

  permutate(object: ObjectDto): ObjectDto[] {
    const results: ObjectDto[] = [];

    const permute = (arr: CoordinatesDto[], m: CoordinatesDto[] = []): void => {
      if (arr.length === 0) {
        results.push(new ObjectDto(m));
      } else {
        for (let i = 0; i < arr.length; i++) {
          const curr = arr.slice();
          const next = curr.splice(i, 1);
          permute(curr.slice(), m.concat(next));
        }
      }
    };

    permute(object.coordinates);

    return results;
  }

  checkAngles(object: ObjectDto): boolean {
    const coords = object.coordinates;

    if (coords.length != this.objectPointsNumber) {
      return false;
    }

    return coords
      .map((coord: CoordinatesDto, i: number) => {
        const pointOne = coord;
        const pointTwo = coords.at((i + 1) % this.objectPointsNumber);
        const pointThree = coords.at((i + 2) % this.objectPointsNumber);

        const vectorOne = new CoordinatesDto(
          pointOne.x - pointTwo.x,
          pointOne.y - pointTwo.y,
        );
        const vectorTwo = new CoordinatesDto(
          pointThree.x - pointTwo.x,
          pointThree.y - pointTwo.y,
        );
        const multiply = vectorOne.x * vectorTwo.x + vectorOne.y * vectorTwo.y;

        const magnitudeOne = Math.sqrt(vectorOne.x ** 2 + vectorOne.y ** 2);
        const magnitudeTwo = Math.sqrt(vectorTwo.x ** 2 + vectorTwo.y ** 2);

        return Math.acos(multiply / (magnitudeOne * magnitudeTwo));
      })
      .every((angle: number) => angle < this.maxAngle);
  }

  getLines(object: ObjectDto): LineDto[] {
    const coords = object.coordinates;

    return coords.map(
      (coord: CoordinatesDto, i: number) =>
        new LineDto(coord, coords.at((i + 1) % this.objectPointsNumber)),
    );
  }

  getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  getRandomUnsignedInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  doesIntersectQuadrilateral(first: ObjectDto, second: ObjectDto): boolean {
    const firstLines = this.getLines(first);
    const secondLines = this.getLines(second);

    return firstLines.some((firstLine: LineDto) =>
      secondLines.some((secondLine: LineDto) =>
        this.doLinesIntersect(firstLine, secondLine),
      ),
    );
  }

  private getOrientation(
    pointOne: CoordinatesDto,
    pointTwo: CoordinatesDto,
    pointThree: CoordinatesDto,
  ): Orientation {
    const val =
      (pointTwo.y - pointOne.y) * (pointThree.x - pointTwo.x) -
      (pointTwo.x - pointOne.x) * (pointThree.y - pointTwo.y);
    if (!val) return Orientation.zero;
    return val > 0 ? Orientation.moreZero : Orientation.lessZero;
  }

  doLinesIntersect(first: LineDto, second: LineDto): boolean {
    const { start: firstStart, end: firstEnd } = first;
    const { start: secondStart, end: secondEnd } = second;

    const orientationOne = this.getOrientation(
      firstStart,
      firstEnd,
      secondStart,
    );
    const orientationTwo = this.getOrientation(firstStart, firstEnd, secondEnd);
    const orientationThree = this.getOrientation(
      secondStart,
      secondEnd,
      firstStart,
    );
    const orientationFour = this.getOrientation(
      secondStart,
      secondEnd,
      firstEnd,
    );

    if (
      (orientationOne !== orientationTwo &&
        orientationThree !== orientationFour) ||
      (!orientationOne && this.onSegment(firstStart, secondStart, firstEnd)) ||
      (!orientationTwo && this.onSegment(firstStart, secondEnd, firstEnd)) ||
      (!orientationThree &&
        this.onSegment(secondStart, firstStart, secondEnd)) ||
      (!orientationFour && this.onSegment(secondStart, firstEnd, secondEnd))
    ) {
      return true;
    }

    return false;
  }

  private onSegment(
    pointOne: CoordinatesDto,
    pointTwo: CoordinatesDto,
    pointThree: CoordinatesDto,
  ): boolean {
    return (
      pointTwo.x <= Math.max(pointOne.x, pointThree.x) &&
      pointTwo.x >= Math.min(pointOne.x, pointThree.x) &&
      pointTwo.y <= Math.max(pointOne.y, pointThree.y) &&
      pointTwo.y >= Math.min(pointOne.y, pointThree.y)
    );
  }

  generateNeighborAngle(angle: number): number {
    const diff = this.getRandomFloat(-this.neighborAngle, this.neighborAngle);
    const newAngle = angle + diff;

    if (newAngle > Math.PI) {
      return Math.PI;
    } else if (newAngle < 0) {
      return 0;
    } else {
      return newAngle;
    }
  }

  generateNeighborPoint(
    coordinate: CoordinatesDto,
    yMax: number,
  ): CoordinatesDto {
    const diapazone = yMax / this.neighborCoord;
    let newY = coordinate.y + this.getRandomFloat(-diapazone, diapazone);

    if (newY > yMax) {
      newY = yMax;
    } else if (newY < 0) {
      newY = 0;
    }

    return new CoordinatesDto(coordinate.x, newY);
  }

  generateRandomAngle(): number {
    const random = Math.random();

    const randomAngleInRadians = random * Math.PI;

    return randomAngleInRadians;
  }

  createLineFromChromosome(chromosome: ChromosomeDto, task: TaskDto): LineDto {
    const y = Math.tan(chromosome.angle) * task.xMax + chromosome.point.y;
    const final = new CoordinatesDto(task.xMax, y);

    return new LineDto(chromosome.point, final);
  }

  countIntersections(line: LineDto, objects: ObjectDto[]): number[] {
    const intersected = [];

    objects.forEach((object, i) => {
      const coords = object.coordinates;
      const lines = coords.map((currentPoint, i) => {
        const finishPoint = coords.at((i + 1) % this.objectPointsNumber);

        return new LineDto(currentPoint, finishPoint);
      });

      const doesIntersect = lines.some((objectLine) =>
        this.doLinesIntersect(line, objectLine),
      );

      if (doesIntersect) intersected.push(i);
    });

    return intersected;
  }
}
