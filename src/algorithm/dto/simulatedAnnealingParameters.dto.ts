export class SimulatedAnnealingParameters {
  coolingFactor: number = parseFloat(process.env.COOLING_FACTOR);
  initialTemperature: number = parseFloat(process.env.INITIAL_TEMPERATURE);
  stoppingTemperature: number = parseFloat(process.env.STOPPING_TEMPERATURE);
}
