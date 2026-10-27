package com.abertech.srportal.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.data.remote.ConnectionState
import com.abertech.srportal.data.remote.ServerStatus
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.ui.theme.SrColors

/**
 * Page frame used by every screen: page background plus the persistent server status bar.
 */
@Composable
fun SrScaffold(
    topBar: @Composable () -> Unit = {},
    content: @Composable (PaddingValues) -> Unit,
) {
    val container = LocalAppContainer.current
    val status by container.health.status.collectAsStateWithLifecycle()
    Scaffold(
        containerColor = SrColors.Slate,
        topBar = topBar,
        bottomBar = { ServerStatusBar(status) },
        content = content,
    )
}

/**
 * The "Server Connection Status" bar from the mockups; dot colour tracks the health monitor.
 */
@Composable
fun ServerStatusBar(status: ServerStatus) {
    val dotColour = when (status.state) {
        ConnectionState.CHECKING -> SrColors.Mist
        ConnectionState.ONLINE -> SrColors.Signal
        ConnectionState.DEMO -> SrColors.Amber
    }
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(SrColors.Slate)
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 12.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(6.dp))
                .background(SrColors.CharcoalDark)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(dotColour),
            )
            Spacer(modifier = Modifier.width(24.dp))
            Column {
                Text(text = "Server Connection Status", color = Color.White, fontSize = 14.sp)
                Text(text = status.detail, color = SrColors.Mist, fontSize = 11.sp)
            }
        }
    }
}

/**
 * The large circular buttons that make up the home screen and the wizard steps.
 */
@Composable
fun CircleButton(
    size: Dp,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    background: Color = SrColors.Charcoal,
    content: @Composable BoxScope.() -> Unit,
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(background)
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
        content = content,
    )
}

/**
 * Dark rounded label under a circle button.
 */
@Composable
fun LabelChip(text: String, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(SrColors.CharcoalDark)
            .padding(horizontal = 14.dp, vertical = 10.dp),
    ) {
        Text(text = text, color = Color.White, fontSize = 17.sp, textAlign = TextAlign.Center)
    }
}

/**
 * Small caption at the top of the wizard pages.
 */
@Composable
fun AberTechHeader(modifier: Modifier = Modifier) {
    Text(
        text = "Designed by AberTech",
        color = Color.White,
        fontSize = 12.sp,
        textAlign = TextAlign.Center,
        modifier = modifier.fillMaxWidth().padding(top = 6.dp),
    )
}

/**
 * The wide "confirm" style button.
 */
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val alpha = if (enabled) 1f else 0.45f
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(62.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(SrColors.Slate.copy(alpha = alpha))
            .border(2.dp, SrColors.Mist.copy(alpha = alpha), RoundedCornerShape(14.dp))
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(text = text, color = SrColors.Mist.copy(alpha = alpha), fontSize = 24.sp)
    }
}

/**
 * Titled card used for the plan sections on the results screen.
 */
@Composable
fun SectionCard(title: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(SrColors.Charcoal)
            .padding(14.dp),
    ) {
        Text(text = title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        Spacer(modifier = Modifier.height(8.dp))
        content()
    }
}

/**
 * Key / value line inside a [SectionCard].
 */
@Composable
fun KeyValueRow(key: String, value: String, valueColour: Color = Color.White) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
        Text(text = key, color = SrColors.Mist, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Text(text = value, color = valueColour, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
    }
}

/**
 * The lavender ring with a violet arc from the splash and home mockups.
 *
 * With [spinning] the arc rotates; otherwise it is a static icon.
 */
@Composable
fun LoadingRing(
    modifier: Modifier = Modifier,
    strokeWidth: Dp = 12.dp,
    spinning: Boolean = false,
    trackColour: Color = SrColors.Lavender,
    arcColour: Color = SrColors.Violet,
) {
    val rotation = if (spinning) {
        val transition = rememberInfiniteTransition(label = "ring")
        val angle by transition.animateFloat(
            initialValue = 0f,
            targetValue = 360f,
            animationSpec = infiniteRepeatable(animation = tween(durationMillis = 1_400, easing = LinearEasing), repeatMode = RepeatMode.Restart),
            label = "ringAngle",
        )
        angle
    } else {
        0f
    }
    Canvas(modifier = modifier.rotate(rotation)) {
        val stroke = Stroke(width = strokeWidth.toPx(), cap = StrokeCap.Round)
        val inset = strokeWidth.toPx() / 2f
        val arcSize = Size(size.width - strokeWidth.toPx(), size.height - strokeWidth.toPx())
        val topLeft = Offset(inset, inset)
        drawArc(color = trackColour, startAngle = 120f, sweepAngle = 270f, useCenter = false, topLeft = topLeft, size = arcSize, style = stroke)
        drawArc(color = arcColour, startAngle = 20f, sweepAngle = 70f, useCenter = false, topLeft = topLeft, size = arcSize, style = stroke)
    }
}

/**
 * Consistent screen title for the list and settings pages.
 */
@Composable
fun ScreenTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        color = Color.White,
        fontSize = 22.sp,
        fontWeight = FontWeight.Bold,
        modifier = modifier.padding(horizontal = 20.dp, vertical = 12.dp),
    )
}
