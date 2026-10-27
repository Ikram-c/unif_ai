package com.abertech.srportal.data

import android.content.Context
import android.util.Log
import com.abertech.srportal.core.SarConfig
import kotlinx.serialization.json.Json

/**
 * Loads planner constants from `assets/sar_config.json`, falling back to the built-in defaults.
 */
object ConfigLoader {
    private const val TAG = "ConfigLoader"
    private const val ASSET_NAME = "sar_config.json"

    /**
     * Parsed config, or defaults when the asset is missing or malformed.
     */
    fun load(context: Context, json: Json): SarConfig = try {
        val text = context.assets.open(ASSET_NAME).bufferedReader().use { it.readText() }
        json.decodeFromString(SarConfig.serializer(), text)
    } catch (e: Exception) {
        Log.w(TAG, "Using default SarConfig: ${e.message}")
        SarConfig()
    }
}
