export interface SSEChatContent {
  event: "token";
  role: string;
  content: string;
  conversationId: string;
}

export interface SSEChatInfo {
  event: "start" | "end" | "error" | "info";
  content: string;
}

export type ChatMessageToolUsage =
  | {
      name: "read_file";
      arguments: { path: string };
    }
  | { name: "check_if_file_exist"; arguments: { path: string } }
  | { name: "create_directory"; arguments: { path: string } }
  | { name: "fetch_webpage"; arguments: { url: string } }
  | { name: "get_folder_structure"; arguments: { path?: string } }
  | {
      name: "get_npm_package_info";
      arguments: { name: string; version?: string };
    }
  | { name: "get_context"; arguments: { searchQuery: string } }
  | { name: "write_file"; arguments: { path: string; content: string } };

export type SSEChatToolCall = {
  event: "tool_call";
} & ChatMessageToolUsage;

export type SSEChatMessage = SSEChatContent | SSEChatInfo | SSEChatToolCall;

export type ChatMessage = {
  role: string;
  content: string;
  conversationId: string;
  tools?: ChatMessageToolUsage[];
};
