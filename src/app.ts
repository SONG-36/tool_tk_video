import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";

import { registerAssetRoutes } from "./api/assetRoutes.js";
import { registerProductRoutes } from "./api/productRoutes.js";
import { registerProjectRoutes } from "./api/projectRoutes.js";

export function registerCoreRoutes(app: FastifyInstance): void {
  app.register(multipart);
  registerProjectRoutes(app);
  registerProductRoutes(app);
  registerAssetRoutes(app);
}

export function buildApp(): FastifyInstance {
  const app = Fastify();

  app.get("/health", async () => {
    return { status: "ok" };
  });

  registerCoreRoutes(app);

  return app;
}
