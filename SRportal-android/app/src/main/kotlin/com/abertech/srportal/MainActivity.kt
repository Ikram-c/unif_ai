package com.abertech.srportal

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.ui.navigation.SrPortalNavGraph
import com.abertech.srportal.ui.theme.SrPortalTheme

/**
 * Single-activity host for the Compose navigation graph.
 */
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )
        val container = (application as SrPortalApp).container
        setContent {
            CompositionLocalProvider(LocalAppContainer provides container) {
                SrPortalTheme {
                    SrPortalNavGraph()
                }
            }
        }
    }
}
