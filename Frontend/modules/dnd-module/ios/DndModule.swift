import ExpoModulesCore

public class DndModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DndModule")

    Function("checkDndPermission") { () -> Bool in
      return false
    }

    Function("requestDndPermission") { () -> Void in
      // No-op on iOS
    }

    Function("setDndMode") { (enabled: Bool) -> Void in
      // No-op on iOS
    }

    Function("isDndEnabled") { () -> Bool in
      return false
    }
  }
}
