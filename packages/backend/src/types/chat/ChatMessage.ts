export type ChatMessage = {
  conversationId: string;
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: Date;
};
