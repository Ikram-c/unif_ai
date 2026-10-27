package com.abertech.srportal.data

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * User-adjustable settings; everything else comes from `assets/sar_config.json`.
 */
data class AppSettings(
    val baseUrl: String = DEFAULT_BASE_URL,
    val timeZone: String = "UTC",
    val forceDemo: Boolean = false,
    val pollSeconds: Int = 5,
) {
    companion object {
        /**
         * The Android emulator's alias for the host machine, where `uvicorn` runs the mock server.
         */
        const val DEFAULT_BASE_URL: String = "http://10.0.2.2:8000/"
    }
}

/**
 * SharedPreferences-backed settings exposed as a state flow.
 */
class SettingsStore(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("srportal", Context.MODE_PRIVATE)
    private val state = MutableStateFlow(read())

    val settings: StateFlow<AppSettings> = state.asStateFlow()

    /**
     * The current snapshot, for non-composable callers.
     */
    val current: AppSettings
        get() = state.value

    /**
     * Applies [transform] and persists the result.
     */
    fun update(transform: (AppSettings) -> AppSettings) {
        val next = transform(state.value)
        prefs.edit()
            .putString(KEY_BASE_URL, next.baseUrl)
            .putString(KEY_TIME_ZONE, next.timeZone)
            .putBoolean(KEY_FORCE_DEMO, next.forceDemo)
            .putInt(KEY_POLL_SECONDS, next.pollSeconds)
            .apply()
        state.value = next
    }

    private fun read(): AppSettings = AppSettings(
        baseUrl = prefs.getString(KEY_BASE_URL, AppSettings.DEFAULT_BASE_URL) ?: AppSettings.DEFAULT_BASE_URL,
        timeZone = prefs.getString(KEY_TIME_ZONE, "UTC") ?: "UTC",
        forceDemo = prefs.getBoolean(KEY_FORCE_DEMO, false),
        pollSeconds = prefs.getInt(KEY_POLL_SECONDS, 5),
    )

    private companion object {
        const val KEY_BASE_URL = "base_url"
        const val KEY_TIME_ZONE = "time_zone"
        const val KEY_FORCE_DEMO = "force_demo"
        const val KEY_POLL_SECONDS = "poll_seconds"
    }
}
