import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";

import { registerAssetRoutes } from "./api/assetRoutes.js";
import { registerExportRoutes } from "./api/exportRoutes.js";
import { registerPipelineRoutes } from "./api/pipelineRoutes.js";
import { registerPromptRoutes } from "./api/promptRoutes.js";
import { registerProductRoutes } from "./api/productRoutes.js";
import { registerProjectRoutes } from "./api/projectRoutes.js";
import { registerScriptRoutes } from "./api/scriptRoutes.js";
import { registerShotRoutes } from "./api/shotRoutes.js";

export function registerCoreRoutes(app: FastifyInstance): void {
  app.register(multipart);
  registerProjectRoutes(app);
  registerProductRoutes(app);
  registerAssetRoutes(app);
  registerPipelineRoutes(app);
  registerScriptRoutes(app);
  registerShotRoutes(app);
  registerPromptRoutes(app);
  registerExportRoutes(app);
}

export function buildApp(): FastifyInstance {
  const app = Fastify();

  app.get("/health", async () => {
    return { status: "ok" };
  });

  registerCoreRoutes(app);

  return app;
}
