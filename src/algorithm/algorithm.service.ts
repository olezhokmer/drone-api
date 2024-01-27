import { Injectable } from '@nestjs/common';
import { CoordinatesDto } from 'src/geometry/dto/coordinates.dto';
import { LineDto } from 'src/geometry/dto/line.dto';
import { ObjectDto } from 'src/geometry/dto/object.dto';
import { GeometryService } from 'src/geometry/geometry.service';
import { ChromosomeDto, ExtendedChromosome } from './dto/chromosome.dto';
import { GeneticAlgorithmParametersDto } from './dto/geneticAlgorithmParameters.dto';
import { SimulatedAnnealingParameters } from './dto/simulatedAnnealingParameters.dto';
import { SolutionDto } from './dto/solution.dto';
import { SolveTaskDto } from './dto/solveTask.dto';
import { TaskDto } from './dto/task.dto';
import { Algorithm } from './enum/algorithm.enum';

@Injectable()
export class AlgorithmService {
  private crossoverPercents: number;

  constructor(private readonly geometryService: GeometryService) {
    this.crossoverPercents = parseFloat(process.env.CROSSOVER_PERCENTS);
  }

  public solveTask(dto: SolveTaskDto): LineDto | SolutionDto {
    switch (dto.algorithm) {
      case Algorithm.genetic:
        return this.runGeneticAlgorithm(
          dto.task,
          (dto.parameters as GeneticAlgorithmParametersDto) ??
            new GeneticAlgorithmParametersDto(),
        );
      case Algorithm.simulatedAnnealing:
        return this.runSimulatedAnnealing(
          dto.task,
          (dto.parameters as SimulatedAnnealingParameters) ??
            new SimulatedAnnealingParameters(),
        );
    }
  }

  private generateChromosome(task: TaskDto, y?: number): ChromosomeDto {
    const { xMax, yMax } = task;
    const yCoordinate = this.geometryService.getRandomFloat(0, yMax);

    if (!y) {
      const topAngle = Math.atan(-yCoordinate / xMax);
      const lowAngle = Math.atan((yMax - yCoordinate) / xMax);

      const angle = this.geometryService.getRandomFloat(topAngle, lowAngle);
      const startPoint = new CoordinatesDto(0, yCoordinate);
      const startChromosome = new ChromosomeDto(angle, startPoint);

      return startChromosome;
    }

    const angle = Math.atan((y - yCoordinate) / task.xMax);
    const startPoint = new CoordinatesDto(0, yCoordinate);
    return new ChromosomeDto(angle, startPoint);
  }

  runGeneticAlgorithm(
    task: TaskDto,
    parameters: GeneticAlgorithmParametersDto,
    y?: number,
  ): LineDto | SolutionDto {
    let population = this.generatePopulation(
      parameters.populationSize,
      task,
      y,
    );

    for (let i = 0; i < parameters.iterationsCount; i++) {
      population = this.createNextPopulation(
        population,
        task,
        parameters.mutationRate,
        y,
      );
    }

    const best = this.findBestIndividual(population, task);
    const line = this.geometryService.createLineFromChromosome(best, task);
    const objectsToExclude = this.calculateFitness(best, task);
    line.intersected = objectsToExclude;
    best.tan = Math.tan(best.angle);
    line.chromosome = best;

    if (!y) {
      const objectsForBackPath = task.objects.map((object, index) => {
        return objectsToExclude.includes(index) ? new ObjectDto([]) : object;
      });

      const yEnd = line.end.y;

      const newTask = new TaskDto();
      newTask.objects = objectsForBackPath;
      newTask.xMax = task.xMax;
      newTask.yMax = task.yMax;

      const endLine = this.runGeneticAlgorithm(
        newTask,
        parameters,
        yEnd,
      ) as LineDto;

      const solution = new SolutionDto();
      solution.start = line;
      solution.finish = endLine;
      solution.intersected = endLine.intersected
        .concat(line.intersected)
        .map((i) => i + 1);
      solution.percent =
        (solution.intersected.length / task.objects.length) * 100;

      return solution;
    }

    return line;
  }

  private findBestIndividual(
    population: ChromosomeDto[],
    task: TaskDto,
  ): ChromosomeDto {
    const fitnesses = population.map(
      (individual) => this.calculateFitness(individual, task).length,
    );
    const index = fitnesses.indexOf(Math.max(...fitnesses));

    return population.at(index);
  }

  private generatePopulation(
    size: number,
    task: TaskDto,
    y?: number,
  ): ChromosomeDto[] {
    return Array.from({ length: size }, () => this.generateChromosome(task, y));
  }

  private chooseRandomChromosome(population: ChromosomeDto[]): ChromosomeDto {
    return population.at(
      this.geometryService.getRandomUnsignedInt(population.length),
    );
  }

  private selectParent(
    population: ChromosomeDto[],
    task: TaskDto,
  ): ChromosomeDto {
    const parentOne = this.chooseRandomChromosome(population);
    const parentTwo = this.chooseRandomChromosome(population);

    const parentsFitnessComparison =
      this.calculateFitness(parentOne, task).length >
      this.calculateFitness(parentTwo, task).length;

    return parentsFitnessComparison ? parentOne : parentTwo;
  }

  private selectParents(
    population: ChromosomeDto[],
    task: TaskDto,
  ): ChromosomeDto[] {
    const father = this.selectParent(population, task);
    const mother = this.selectParent(population, task);

    return [father, mother];
  }

  private pickParent(
    father: ChromosomeDto,
    mother: ChromosomeDto,
  ): ChromosomeDto {
    return Math.random() < this.crossoverPercents ? father : mother;
  }

  private crossover(
    father: ChromosomeDto,
    mother: ChromosomeDto,
    xMax: number,
    y?: number,
  ): ChromosomeDto {
    const point = this.pickParent(father, mother).point;
    let angle: number;

    if (!y) {
      angle = this.pickParent(father, mother).angle;
    } else {
      angle = Math.atan((y - point.y) / xMax);
    }

    return new ChromosomeDto(angle, point);
  }

  private mutateIndividual(
    individual: ChromosomeDto,
    task: TaskDto,
    mutationRate: number,
    y?: number,
  ): ChromosomeDto {
    if (Math.random() < mutationRate) {
      return this.generateChromosome(task, y);
    }

    return individual;
  }

  private createNextPopulation(
    population: ChromosomeDto[],
    task: TaskDto,
    mutationRate: number,
    y?: number,
  ): ChromosomeDto[] {
    return population.map(() => {
      const [father, mother] = this.selectParents(population, task);
      const child = this.crossover(father, mother, task.xMax, y);
      const mutated = this.mutateIndividual(child, task, mutationRate, y);

      return mutated;
    });
  }

  private calculateFitness(chromosome: ChromosomeDto, task: TaskDto): number[] {
    const line = this.geometryService.createLineFromChromosome(
      chromosome,
      task,
    );
    const intersections = this.geometryService.countIntersections(
      line,
      task.objects,
    );

    return intersections;
  }

  private simulatedAnnealing(
    initial: ChromosomeDto,
    task: TaskDto,
    parameters: SimulatedAnnealingParameters,
  ): ChromosomeDto {
    let current = initial;
    let currentFitness = this.calculateFitness(current, task).length;
    let best = current;
    let bestFitness = currentFitness;
    let temperature = parameters.initialTemperature;
    let iteration = 0;

    while (temperature > parameters.stoppingTemperature) {
      const neighbor = this.getNeighbor(current, task.yMax);
      const neighborFitness = this.calculateFitness(neighbor, task).length;

      const delta = neighborFitness - currentFitness;

      if (this.accept(temperature, delta)) {
        current = neighbor;
        currentFitness = neighborFitness;

        if (currentFitness > bestFitness) {
          best = current;
          bestFitness = currentFitness;
        }
      }

      temperature = temperature * parameters.coolingFactor;
      iteration++;
    }

    return best;
  }

  private getNeighbor(individual: ChromosomeDto, yMax: number): ChromosomeDto {
    const angle = this.geometryService.generateNeighborAngle(individual.angle);
    const point = this.geometryService.generateNeighborPoint(
      individual.point,
      yMax,
    );

    return new ChromosomeDto(angle, point);
  }

  private accept(temperature: number, delta: number): boolean {
    if (delta < 0) {
      return true;
    } else {
      const probability = Math.exp(-delta / temperature);

      return Math.random() < probability;
    }
  }

  private runSimulatedAnnealing(
    task: TaskDto,
    parameters: SimulatedAnnealingParameters,
  ): LineDto {
    const chromosome = this.generateChromosome(task);
    const best = this.simulatedAnnealing(chromosome, task, parameters);
    const line = this.geometryService.createLineFromChromosome(best, task);

    return line;
  }
}
