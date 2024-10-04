import type { SSEChatMessage } from "./SSEChatMessage.js";

export type SendSSEFunction = (event: SSEChatMessage) => Promise<void>;
