package com.abertech.srportal

import android.app.Application
import android.content.Context
import com.abertech.srportal.di.AppContainer
import java.io.File
import org.osmdroid.config.Configuration

/**
 * Application entry point: configures osmdroid and builds the dependency container.
 */
class SrPortalApp : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        configureOsmdroid()
        container = AppContainer(this)
    }

    private fun configureOsmdroid() {
        val configuration = Configuration.getInstance()
        configuration.load(this, getSharedPreferences("osmdroid", Context.MODE_PRIVATE))
        configuration.userAgentValue = packageName
        configuration.osmdroidBasePath = File(cacheDir, "osmdroid")
        configuration.osmdroidTileCache = File(cacheDir, "osmdroid/tiles")
    }
}
