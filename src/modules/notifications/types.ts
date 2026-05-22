export type NotificationCategory =
  | "order"
  | "payout"
  | "dispute"
  | "system"
  | "message";

export type NotificationFilter =
  | "all"
  | "unread"
  | "orders"
  | "system"
  | "finance";

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
  /** Deep link within vendor app */
  href?: string;
};
