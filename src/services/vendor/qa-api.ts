import { vendorApiClient } from "@/services/api/client";

export type QaThread = {
  id: string;
  productId: string;
  customerName: string;
  question: string;
  createdAt: string;
  answers: Array<{
    id: string;
    answer: string;
    answeredBy: string;
    createdAt: string;
  }>;
};

export type CreateQaAnswerDto = {
  answer: string;
};

/** GET /products/:productId/qa — list Q&A threads for a product */
export async function listProductQa(productId: string) {
  const { data } = await vendorApiClient.get<QaThread[]>(`/api/v1/products/${productId}/qa`);
  return data;
}

/** POST /products/:productId/qa — ask a question about a product */
export async function createProductQaQuestion(productId: string, body: { question: string }) {
  const { data } = await vendorApiClient.post<QaThread>(`/api/v1/products/${productId}/qa`, body);
  return data;
}

/** POST /qa/:threadId/answers — answer a Q&A thread */
export async function answerQaThread(threadId: string, body: CreateQaAnswerDto) {
  const { data } = await vendorApiClient.post(`/api/v1/qa/${threadId}/answers`, body);
  return data;
}
