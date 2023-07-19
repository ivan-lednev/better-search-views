import "obsidian";
import { ViewCreator } from "obsidian";

declare module "obsidian" {
  export interface ViewRegistry {
    registerView(
      type: string,
      viewCreator: ViewCreator,
      ...args: unknown[]
    ): void;
  }

  interface SearchView {}

  export interface App {
    viewRegistry: ViewRegistry;
  }
}
