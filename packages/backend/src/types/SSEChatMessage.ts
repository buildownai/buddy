export interface SSEChatContent {
  event: "token";
  role: string;
  content: string;
}

export interface SSEChatInfo {
  event: "start" | "end" | "error" | "info";
  content: string;
}

export type SSEChatToolCall = {
  event: "tool_call";
} & (
  | {
      name: "read_file";
      arguments: { path: string };
    }
  | { name: "check_if_file_exist"; arguments: { path: string } }
  | { name: "create_directory"; arguments: { path: string } }
  | { name: "fetch_webpage"; arguments: { url: string } }
  | { name: "get_folder_file_structure"; arguments: { path?: string } }
  | {
      name: "get_npm_package_info";
      arguments: { name: string; version?: string };
    }
  | { name: "get_context"; arguments: { searchQuery: string } }
  | { name: "write_file"; arguments: { path: string; content: string } }
);

export type SSEChatMessage = SSEChatContent | SSEChatInfo | SSEChatToolCall;
