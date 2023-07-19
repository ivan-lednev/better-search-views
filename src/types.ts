declare module "obsidian" {
  interface ViewRegistry {}

  interface App {
    viewRegistry: ViewRegistry;
  }
}

export {};
