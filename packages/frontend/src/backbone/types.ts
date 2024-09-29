export type BackboneEvent = {
  open_file: { path: string };
  delete_file: { path: string };
  rename_file: { from: string; to: string };
  apply_code_to_file: { code: string; filename: string };
  ask_chat: { code: string; filename?: string };
  sse_progress: SSEProgressMessage;
  sse_info: SSEInfoMessage;
  sse_complete: SSECompleteMessage;
  sse_error: SSEErrorMessage;
};