package com.abertech.srportal.di

import android.content.Context
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.abertech.srportal.core.DemoDataset
import com.abertech.srportal.core.RescuePlanner
import com.abertech.srportal.core.SarConfig
import com.abertech.srportal.data.ConfigLoader
import com.abertech.srportal.data.RescueRepository
import com.abertech.srportal.data.SettingsStore
import com.abertech.srportal.data.local.RescueStore
import com.abertech.srportal.data.remote.DemoBackend
import com.abertech.srportal.data.remote.RemoteBackend
import com.abertech.srportal.data.remote.ServerHealthMonitor
import java.io.File
import java.time.Instant
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.serialization.json.Json

/**
 * Hand-wired dependency graph; small enough that a DI framework would be noise.
 */
class AppContainer(context: Context) {
    val appScope: CoroutineScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    val json: Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        encodeDefaults = true
        isLenient = true
    }

    val settings: SettingsStore = SettingsStore(context)
    val config: SarConfig = ConfigLoader.load(context, json)
    val demo: DemoDataset = DemoDataset(config)
    val planner: RescuePlanner = RescuePlanner(config)
    val remote: RemoteBackend = RemoteBackend(settings, json)
    val demoBackend: DemoBackend = DemoBackend(demo)
    val health: ServerHealthMonitor = ServerHealthMonitor(remote, settings, appScope)
    val store: RescueStore = RescueStore(File(context.filesDir, "rescues.json"), json)
    val repository: RescueRepository = RescueRepository(remote, demoBackend, health, store, planner, demo)
    val clock: () -> Instant = { Instant.now() }
}

/**
 * Makes the container reachable from any composable without threading it through parameters.
 */
val LocalAppContainer = staticCompositionLocalOf<AppContainer> { error("AppContainer not provided") }

/**
 * Minimal factory so screens can build view models with constructor arguments.
 */
class SarViewModelFactory(private val creator: () -> ViewModel) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T = creator() as T
}
