import { z } from "zod";

const chatAttachmentSchema = z.object({
  id: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  signedUrl: z.string().optional(),
  expiresIn: z.number().optional(),
});

export const chatMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderUserId: z.string(),
  messageType: z.enum(["text", "image", "mixed", "document"]).optional(),
  body: z.string().nullable(),
  attachments: z.array(chatAttachmentSchema).optional(),
  createdAt: z.string(),
  translatedBody: z.string().optional(),
  originalLanguage: z.string().optional(),
  targetLanguage: z.string().optional(),
});

export const notificationCreatedSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  category: z.enum(["order", "payout", "dispute", "system", "message"]),
  href: z.string().optional(),
  createdAt: z.string(),
  read: z.boolean().optional(),
});

export const orderUpdatedSchema = z.object({
  orderId: z.string(),
  status: z.string().optional(),
  timelineNote: z.string().optional(),
});

export const inventoryUpdatedSchema = z.object({
  lineId: z.string(),
  delta: z.number(),
  movementType: z.enum([
    "receipt",
    "shipment",
    "adjustment",
    "transfer_in",
    "transfer_out",
  ]),
  note: z.string().optional(),
});

export const vendorUpdatedSchema = z.object({
  vendorId: z.string(),
  status: z.string(),
  rejectionReason: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
});
