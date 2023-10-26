export class GeneticAlgorithmParametersDto {
  populationSize: number = parseFloat(process.env.POPULATION_SIZE);
  iterationsCount: number = parseFloat(process.env.ITERATIONS_COUNT);
  mutationRate: number = parseFloat(process.env.MUTATION_RATE);
}
