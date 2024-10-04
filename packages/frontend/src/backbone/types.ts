export type BackboneEvent = {
  // Action Events - trigger to do some action
  open_file: { path: string }
  delete_file: { path: string }
  rename_file: { from: string; to: string }
  apply_code_to_file: { code: string; filename: string }
  save_file: { code: string; filename: string }
  ask_chat: { code: string; filename?: string }

  // Action Result Events - some action was performed
  file_upserted: { path: string }
  file_deleted: { path: string }
  file_opened: { path: string }
}
