import type { FastifyInstance } from 'fastify';
import { registerBlueprintRoutes } from './blueprints.js';

export async function registerBuildingVisualizationRoutes(app: FastifyInstance): Promise<void> {
  await registerBlueprintRoutes(app);
}
