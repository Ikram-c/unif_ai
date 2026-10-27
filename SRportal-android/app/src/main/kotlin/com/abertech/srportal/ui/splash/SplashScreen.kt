package com.abertech.srportal.ui.splash

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.data.remote.ConnectionState
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.ui.components.AberTechHeader
import com.abertech.srportal.ui.components.LoadingRing
import com.abertech.srportal.ui.components.SrIcons
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.withTimeoutOrNull

/**
 * Splash card with the loading ring; moves on once the first health check has answered.
 */
@Composable
fun SplashScreen(onReady: () -> Unit) {
    val container = LocalAppContainer.current
    val status by container.health.status.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        container.repository.load(container.clock())
        val started = System.currentTimeMillis()
        withTimeoutOrNull(MAX_WAIT_MS) {
            while (container.health.status.value.state == ConnectionState.CHECKING) delay(100)
        }
        container.repository.mergeFromServer()
        val remaining = MIN_SHOW_MS - (System.currentTimeMillis() - started)
        if (remaining > 0) delay(remaining)
        onReady()
    }

    SrScaffold { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 12.dp, vertical = 8.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(SrColors.Charcoal),
        ) {
            AberTechHeader(modifier = Modifier.align(Alignment.TopCenter))
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .fillMaxWidth()
                    .padding(bottom = 120.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(modifier = Modifier.size(190.dp), contentAlignment = Alignment.Center) {
                    Box(
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .background(SrColors.Slate),
                        contentAlignment = Alignment.Center,
                    ) {
                        SrIcons.Mountain(modifier = Modifier.size(110.dp))
                    }
                    LoadingRing(modifier = Modifier.size(190.dp), strokeWidth = 14.dp, spinning = true)
                }
                Spacer(modifier = Modifier.height(24.dp))
                Text(
                    text = "Search And Rescue\nPortal",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    lineHeight = 28.sp,
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = status.detail, color = SrColors.Mist, fontSize = 12.sp, textAlign = TextAlign.Center)
            }
        }
    }
}

private const val MIN_SHOW_MS = 1_600L
private const val MAX_WAIT_MS = 4_500L
