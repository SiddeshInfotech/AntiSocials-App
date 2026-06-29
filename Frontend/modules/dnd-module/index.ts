// Re-export the native module. On web, it will be resolved to DndModule.web.ts
// and on native platforms to DndModule.ts
export { default } from './src/DndModule';
export * from './src/DndModule.types';
