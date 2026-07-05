import type { FastifyInstance, FastifyReply } from "fastify";

import {
  getProductByProjectId,
  saveProduct,
  type SaveProductInput,
} from "../services/productService.js";
import { createAppError, isAppError } from "../utils/errors.js";

interface ProjectParams {
  project_id: string;
}

interface SaveProductBody {
  name?: string;
  category?: string;
  description?: string;
  selling_points?: string[];
  target_audience?: string | null;
  usage_scenarios?: string[];
  price?: string | number | null;
  currency?: string | null;
  product_url?: string | null;
  sku_code?: string | null;
  brand_name?: string | null;
}

interface ProductRouteDependencies {
  saveProduct?: (input: SaveProductInput) => ReturnType<typeof saveProduct>;
  getProductByProjectId?: typeof getProductByProjectId;
}

function sendRouteError(reply: FastifyReply, error: unknown) {
  if (!isAppError(error)) {
    throw error;
  }

  return reply.code(error.status_code).send({
    success: false,
    error,
  });
}

export function registerProductRoutes(
  app: FastifyInstance,
  dependencies: ProductRouteDependencies = {},
): void {
  const saveProductRecord = dependencies.saveProduct ?? saveProduct;
  const getProduct =
    dependencies.getProductByProjectId ?? getProductByProjectId;

  app.put<{ Params: ProjectParams; Body: SaveProductBody }>(
    "/projects/:project_id/product",
    async (request, reply) => {
      try {
        const product = await saveProductRecord({
          project_id: request.params.project_id,
          name: request.body?.name ?? "",
          category: request.body?.category ?? "",
          description: request.body?.description ?? "",
          selling_points: request.body?.selling_points ?? [],
          target_audience: request.body?.target_audience,
          usage_scenarios: request.body?.usage_scenarios,
          price: request.body?.price,
          currency: request.body?.currency,
          product_url: request.body?.product_url,
          sku_code: request.body?.sku_code,
          brand_name: request.body?.brand_name,
        });

        return {
          success: true,
          data: product,
        };
      } catch (error) {
        return sendRouteError(reply, error);
      }
    },
  );

  app.get<{ Params: ProjectParams }>(
    "/projects/:project_id/product",
    async (request, reply) => {
      try {
        const product = await getProduct(request.params.project_id);

        if (!product) {
          return sendRouteError(
            reply,
            createAppError({
              errorCode: "PRODUCT_NOT_FOUND",
              message: "Product not found",
              statusCode: 404,
            }),
          );
        }

        return {
          success: true,
          data: product,
        };
      } catch (error) {
        return sendRouteError(reply, error);
      }
    },
  );
}
