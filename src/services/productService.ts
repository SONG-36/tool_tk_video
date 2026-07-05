import {
  findProductByProjectId,
  upsertProductByProjectId,
  type ProductInput,
} from "../repositories/productRepository.js";
import { createAppError } from "../utils/errors.js";

export interface SaveProductInput {
  project_id: string;
  name: string;
  category: string;
  description: string;
  selling_points: string[];
  target_audience?: string | null;
  usage_scenarios?: string[];
  price?: string | number | null;
  currency?: string | null;
  product_url?: string | null;
  sku_code?: string | null;
  brand_name?: string | null;
}

function requireText(value: string | undefined, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw createAppError({
      errorCode: "INVALID_PRODUCT_INPUT",
      message: `${fieldName} is required`,
      statusCode: 400,
    });
  }
}

export function saveProduct(input: SaveProductInput) {
  requireText(input.project_id, "project_id");
  requireText(input.name, "name");
  requireText(input.category, "category");
  requireText(input.description, "description");

  if (
    !Array.isArray(input.selling_points) ||
    !input.selling_points.some((sellingPoint) => sellingPoint.trim().length > 0)
  ) {
    throw createAppError({
      errorCode: "INVALID_PRODUCT_INPUT",
      message: "selling_points must contain at least one item",
      statusCode: 400,
    });
  }

  const data: Omit<ProductInput, "project_id"> = {
    name: input.name,
    category: input.category,
    description: input.description,
    selling_points: input.selling_points,
    target_audience: input.target_audience,
    usage_scenarios: input.usage_scenarios ?? [],
    price: input.price,
    currency: input.currency,
    product_url: input.product_url,
    sku_code: input.sku_code,
    brand_name: input.brand_name,
  };

  return upsertProductByProjectId(input.project_id, data);
}

export function getProductByProjectId(projectId: string) {
  requireText(projectId, "project_id");

  return findProductByProjectId(projectId);
}
