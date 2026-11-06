import type { FastifyInstance } from 'fastify';
import { registerBlueprintRoutes } from './blueprints.js';
import { registerApplianceRoutes } from './appliances.js';
import { registerEnergyRoutes } from './energy.js';

export async function registerBuildingVisualizationRoutes(app: FastifyInstance): Promise<void> {
  await registerBlueprintRoutes(app);
  await registerApplianceRoutes(app);
  await registerEnergyRoutes(app);
}
