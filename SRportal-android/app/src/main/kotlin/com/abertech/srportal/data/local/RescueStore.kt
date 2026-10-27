package com.abertech.srportal.data.local

import android.util.Log
import com.abertech.srportal.core.Rescue
import java.io.File
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/**
 * Persists rescues as one JSON document in the app's private files directory.
 *
 * Writes go to a temporary file first and are renamed into place so a crash mid-write never
 * leaves a truncated document behind.
 */
class RescueStore(private val file: File, private val json: Json) {
    private val mutex = Mutex()
    private val serializer = ListSerializer(Rescue.serializer())

    /**
     * All stored rescues, or an empty list when nothing has been saved yet.
     */
    suspend fun readAll(): List<Rescue> = withContext(Dispatchers.IO) {
        mutex.withLock {
            if (!file.exists()) return@withLock emptyList<Rescue>()
            try {
                json.decodeFromString(serializer, file.readText())
            } catch (e: Exception) {
                Log.w(TAG, "Discarding unreadable rescue store: ${e.message}")
                emptyList()
            }
        }
    }

    /**
     * Replaces the stored document with [rescues].
     */
    suspend fun writeAll(rescues: List<Rescue>) = withContext(Dispatchers.IO) {
        mutex.withLock {
            file.parentFile?.mkdirs()
            val temp = File(file.parentFile, file.name + ".tmp")
            temp.writeText(json.encodeToString(serializer, rescues))
            if (!temp.renameTo(file)) {
                file.writeText(temp.readText())
                temp.delete()
            }
        }
    }

    private companion object {
        const val TAG = "RescueStore"
    }
}
