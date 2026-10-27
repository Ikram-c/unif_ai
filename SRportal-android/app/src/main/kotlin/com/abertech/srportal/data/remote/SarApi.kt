package com.abertech.srportal.data.remote

import com.abertech.srportal.core.Observation
import com.abertech.srportal.core.Place
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.SearchDataBundle
import com.abertech.srportal.core.SearchWindowRequest
import com.abertech.srportal.core.ServerHealth
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Retrofit contract for the cloud server in `server/`; every button in the app ends here.
 */
interface SarApi {
    @GET("health")
    suspend fun health(): ServerHealth

    @GET("rescues")
    suspend fun listRescues(): List<Rescue>

    @PUT("rescues/{id}")
    suspend fun saveRescue(@Path("id") id: String, @Body rescue: Rescue): Rescue

    @POST("search-window")
    suspend fun searchWindow(@Body request: SearchWindowRequest): SearchDataBundle

    @POST("rescues/{id}/observations/{observationId}/detect")
    suspend fun triggerDetection(@Path("id") id: String, @Path("observationId") observationId: String): Observation

    @GET("rescues/{id}/observations/{observationId}")
    suspend fun observation(@Path("id") id: String, @Path("observationId") observationId: String): Observation

    @GET("geocode")
    suspend fun geocode(@Query("q") query: String): List<Place>
}

/**
 * What the app needs from a backend; implemented by the server client and by the demo stand-in.
 */
interface SarBackend {
    suspend fun health(): ServerHealth
    suspend fun listRescues(): List<Rescue>
    suspend fun saveRescue(rescue: Rescue): Rescue
    suspend fun searchWindow(request: SearchWindowRequest): SearchDataBundle
    suspend fun triggerDetection(rescueId: String, observationId: String): Observation
    suspend fun observation(rescueId: String, observationId: String): Observation
    suspend fun geocode(query: String): List<Place>
}
