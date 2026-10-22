import { sampleEnergyApi } from "./api/sampleEnergyApi";
import { httpEnergyApi } from "./api/httpEnergyApi";
import { config } from "../config/env";
import type { EnergyApi } from "./api/energyApi";

// Selects the real backend client when VITE_USE_SAMPLE_DATA is not "true".
export function getEnergyApi(): EnergyApi {
  return config.useSampleData ? sampleEnergyApi : httpEnergyApi;
}
