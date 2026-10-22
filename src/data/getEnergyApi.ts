import { sampleEnergyApi } from "./api/sampleEnergyApi";
import type { EnergyApi } from "./api/energyApi";

// Swap this implementation for the real backend client once API fields are agreed.
export function getEnergyApi(): EnergyApi {
  return sampleEnergyApi;
}
