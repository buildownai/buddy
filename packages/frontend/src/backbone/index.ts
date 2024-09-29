import mitt, { type Emitter } from "mitt";
import type { BackboneEvent } from "./types.js";

export const backbone: Emitter<BackboneEvent> = mitt<BackboneEvent>();

// Extend the Window interface to add `eventBus`
declare global {
  interface Window {
    backbone: typeof backbone;
  }
}
