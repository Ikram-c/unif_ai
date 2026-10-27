package com.abertech.srportal.data.remote

import com.abertech.srportal.data.SettingsStore
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout

/**
 * What the bottom status bar shows: still checking, talking to the server, or on demo data.
 */
enum class ConnectionState { CHECKING, ONLINE, DEMO }

/**
 * Latest health-check outcome.
 */
data class ServerStatus(val state: ConnectionState, val detail: String)

/**
 * Polls `/health` in the background and publishes the result for every screen.
 */
class ServerHealthMonitor(
    private val remote: RemoteBackend,
    private val settings: SettingsStore,
    scope: CoroutineScope,
) {
    private val state = MutableStateFlow(ServerStatus(ConnectionState.CHECKING, "Checking server"))

    val status: StateFlow<ServerStatus> = state.asStateFlow()

    /**
     * True when the last check reached the server and demo mode is not forced.
     */
    val isOnline: Boolean
        get() = state.value.state == ConnectionState.ONLINE

    init {
        scope.launch { pollForever() }
    }

    /**
     * Runs one health check now and publishes the outcome.
     */
    suspend fun checkOnce(): ServerStatus {
        val current = settings.current
        val next = if (current.forceDemo) {
            ServerStatus(ConnectionState.DEMO, "Demo mode forced in Settings")
        } else {
            try {
                val health = withTimeout(HEALTH_TIMEOUT_MS) { remote.health() }
                val rows = health.dbRows.values.sum()
                ServerStatus(ConnectionState.ONLINE, "Online, v${health.version}, $rows indexed rows")
            } catch (e: Exception) {
                if (e is CancellationException && e !is TimeoutCancellationException) throw e
                ServerStatus(ConnectionState.DEMO, "Offline, using demo data (${shortReason(e)})")
            }
        }
        state.value = next
        return next
    }

    private suspend fun pollForever() {
        while (true) {
            checkOnce()
            val seconds = settings.current.pollSeconds.coerceIn(2, 60)
            delay(seconds * 1_000L)
        }
    }

    private fun shortReason(e: Exception): String = when (e) {
        is ConnectException -> "no server"
        is SocketTimeoutException -> "timeout"
        is TimeoutCancellationException -> "timeout"
        is UnknownHostException -> "unknown host"
        else -> e.javaClass.simpleName
    }

    private companion object {
        const val HEALTH_TIMEOUT_MS = 4_000L
    }
}
