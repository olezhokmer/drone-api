import { Algorithm } from '../enum/algorithm.enum';
import { GeneticAlgorithmParametersDto } from './geneticAlgorithmParameters.dto';
import { SimulatedAnnealingParameters } from './simulatedAnnealingParameters.dto';
import { TaskDto } from './task.dto';

export class SolveTaskDto {
  algorithm: Algorithm;
  task: TaskDto;
  parameters?: GeneticAlgorithmParametersDto | SimulatedAnnealingParameters;
}
