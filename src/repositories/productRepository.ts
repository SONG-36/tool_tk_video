import { prisma } from "../db/client.js";

export interface ProductInput {
  project_id: string;
  name: string;
  category: string;
  description: string;
  selling_points: string[];
  target_audience?: string | null;
  usage_scenarios: string[];
  price?: string | number | null;
  currency?: string | null;
  product_url?: string | null;
  sku_code?: string | null;
  brand_name?: string | null;
}

export function createProduct(data: ProductInput) {
  return prisma.product.create({
    data,
  });
}

export function upsertProductByProjectId(
  projectId: string,
  data: Omit<ProductInput, "project_id">,
) {
  return prisma.product.upsert({
    where: {
      project_id: projectId,
    },
    create: {
      ...data,
      project_id: projectId,
    },
    update: {
      name: data.name,
      category: data.category,
      description: data.description,
      selling_points: data.selling_points,
      target_audience: data.target_audience,
      usage_scenarios: data.usage_scenarios,
      price: data.price,
      currency: data.currency,
      product_url: data.product_url,
      sku_code: data.sku_code,
      brand_name: data.brand_name,
    },
  });
}

export function findProductByProjectId(projectId: string) {
  return prisma.product.findUnique({
    where: {
      project_id: projectId,
    },
  });
}
