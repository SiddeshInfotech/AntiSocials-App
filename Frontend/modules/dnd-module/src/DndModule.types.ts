export interface DndModuleType {
  checkDndPermission(): boolean;
  requestDndPermission(): void;
  setDndMode(enabled: boolean): void;
  isDndEnabled(): boolean;
  isNative: boolean;
}
