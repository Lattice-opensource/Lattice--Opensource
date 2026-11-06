import type { FastifyInstance } from 'fastify';
import { registerBlueprintRoutes } from './blueprints.js';
import { registerApplianceRoutes } from './appliances.js';
import { registerEnergyRoutes } from './energy.js';
import { registerBuildingAlertRoutes } from './alerts.js';
import { registerBuildingRoutes } from './buildings.js';
import { registerFloorRoutes } from './floors.js';
import { registerRoomRoutes } from './rooms.js';
import { registerMeterRoutes } from './meters.js';
import { registerCircuitRoutes } from './circuits.js';

export async function registerBuildingVisualizationRoutes(app: FastifyInstance): Promise<void> {
  await registerBlueprintRoutes(app);
  await registerApplianceRoutes(app);
  await registerEnergyRoutes(app);
  await registerBuildingAlertRoutes(app);
  await registerBuildingRoutes(app);
  await registerFloorRoutes(app);
  await registerRoomRoutes(app);
  await registerMeterRoutes(app);
  await registerCircuitRoutes(app);
}
