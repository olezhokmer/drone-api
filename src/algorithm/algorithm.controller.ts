import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AlgorithmService } from './algorithm.service';
import { SolveTaskDto } from './dto/solveTask.dto';

@Controller('algorithm')
export class AlgorithmController {
  constructor(private readonly algorithmService: AlgorithmService) {}

  @Post()
  solveTask(@Body() body: SolveTaskDto) {
    return this.algorithmService.solveTask(body);
  }
}
