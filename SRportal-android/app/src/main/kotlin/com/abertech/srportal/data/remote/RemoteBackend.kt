package com.abertech.srportal.data.remote

import com.abertech.srportal.core.Observation
import com.abertech.srportal.core.Place
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.SearchDataBundle
import com.abertech.srportal.core.SearchWindowRequest
import com.abertech.srportal.core.ServerHealth
import com.abertech.srportal.data.SettingsStore
import java.util.concurrent.TimeUnit
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * HTTP client for the cloud server; rebuilds the Retrofit instance whenever the base URL changes.
 */
class RemoteBackend(private val settings: SettingsStore, private val json: Json) : SarBackend {
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()

    @Volatile
    private var cached: Pair<String, SarApi>? = null

    override suspend fun health(): ServerHealth = api().health()

    override suspend fun listRescues(): List<Rescue> = api().listRescues()

    override suspend fun saveRescue(rescue: Rescue): Rescue = api().saveRescue(rescue.id, rescue)

    override suspend fun searchWindow(request: SearchWindowRequest): SearchDataBundle = api().searchWindow(request)

    override suspend fun triggerDetection(rescueId: String, observationId: String): Observation =
        api().triggerDetection(rescueId, observationId)

    override suspend fun observation(rescueId: String, observationId: String): Observation =
        api().observation(rescueId, observationId)

    override suspend fun geocode(query: String): List<Place> = api().geocode(query)

    private fun api(): SarApi {
        val url = normalise(settings.current.baseUrl)
        val existing = cached
        if (existing != null && existing.first == url) return existing.second
        val retrofit = Retrofit.Builder()
            .baseUrl(url)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
        val api = retrofit.create(SarApi::class.java)
        cached = url to api
        return api
    }

    /**
     * Retrofit needs a scheme and a trailing slash; users rarely type either.
     */
    private fun normalise(raw: String): String {
        var url = raw.trim()
        if (url.isEmpty()) url = "http://10.0.2.2:8000/"
        if (!url.startsWith("http://") && !url.startsWith("https://")) url = "http://$url"
        if (!url.endsWith("/")) url = "$url/"
        return url
    }
}
