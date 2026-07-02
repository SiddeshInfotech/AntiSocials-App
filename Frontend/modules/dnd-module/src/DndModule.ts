import { NativeModule, requireNativeModule } from 'expo';

declare class DndModule extends NativeModule<{}> {
  checkDndPermission(): boolean;
  requestDndPermission(): void;
  setDndMode(enabled: boolean): void;
  isDndEnabled(): boolean;
  isNative: boolean;
}

let nativeModule: any = null;
try {
  nativeModule = requireNativeModule<DndModule>('DndModule');
  nativeModule.isNative = true;
} catch (e) {
  console.warn("DndModule native module not found (running in Expo Go/Simulator). Falling back to mock.");
  nativeModule = {
    checkDndPermission: () => false,
    requestDndPermission: () => {},
    setDndMode: (enabled: boolean) => {},
    isDndEnabled: () => false,
    isNative: false,
  };
}

export default nativeModule;
