import { registerWebModule, NativeModule } from 'expo';

class DndModule extends NativeModule<{}> {
  isNative = false;
  checkDndPermission() {
    return false;
  }
  requestDndPermission() {}
  setDndMode(enabled: boolean) {
    // No-op
  }
  isDndEnabled() {
    return false;
  }
}

export default registerWebModule(DndModule, 'DndModule');
