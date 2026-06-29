package expo.modules.dndmodule

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DndModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext)

  private val notificationManager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  override fun definition() = ModuleDefinition {
    Name("DndModule")

    Function("checkDndPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        notificationManager.isNotificationPolicyAccessGranted
      } else {
        true
      }
    }

    Function("requestDndPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (!notificationManager.isNotificationPolicyAccessGranted) {
          val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(intent)
        }
      }
    }

    Function("setDndMode") { enabled: Boolean ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (notificationManager.isNotificationPolicyAccessGranted) {
          if (enabled) {
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
          } else {
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
          }
        }
      }
    }

    Function("isDndEnabled") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val filter = notificationManager.currentInterruptionFilter
        filter == NotificationManager.INTERRUPTION_FILTER_NONE ||
        filter == NotificationManager.INTERRUPTION_FILTER_ALARMS ||
        filter == NotificationManager.INTERRUPTION_FILTER_PRIORITY
      } else {
        false
      }
    }
  }
}
