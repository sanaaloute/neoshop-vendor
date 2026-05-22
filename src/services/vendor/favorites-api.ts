import { vendorApiClient } from "@/services/api/client";

/** GET /favorites/products */
export async function listFavoriteProducts() {
  const { data } = await vendorApiClient.get("/api/v1/favorites/products");
  return data;
}

/** POST /favorites/products */
export async function addFavoriteProduct(body: { productId: string }) {
  const { data } = await vendorApiClient.post("/api/v1/favorites/products", body);
  return data;
}

/** DELETE /favorites/products/:productId */
export async function removeFavoriteProduct(productId: string) {
  await vendorApiClient.delete(`/api/v1/favorites/products/${productId}`);
}
