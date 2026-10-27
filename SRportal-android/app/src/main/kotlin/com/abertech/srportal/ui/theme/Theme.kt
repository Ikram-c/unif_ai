package com.abertech.srportal.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * Palette lifted from the AberTech mockups: mid-grey page, charcoal cards, lavender / violet ring.
 */
object SrColors {
    val Slate = Color(0xFF5B5B5B)
    val Charcoal = Color(0xFF383838)
    val CharcoalDark = Color(0xFF2B2B2B)
    val Mist = Color(0xFFD9D9D9)
    val Lavender = Color(0xFFE6DEF5)
    val Violet = Color(0xFF6B5AA6)
    val Signal = Color(0xFF34C759)
    val Amber = Color(0xFFF5A623)
    val Danger = Color(0xFFE5484D)
    val Sun = Color(0xFFF2D06B)
    val Sky = Color(0xFF8ED0FF)
    val Ink = Color(0xFF141414)
    val Satellite = Color(0xFF7DD3FC)
    val Dashcam = Color(0xFFF2D06B)
    val Uav = Color(0xFF86EFAC)
}

private val DarkScheme = darkColorScheme(
    primary = SrColors.Violet,
    onPrimary = Color.White,
    primaryContainer = SrColors.CharcoalDark,
    onPrimaryContainer = Color.White,
    secondary = SrColors.Mist,
    onSecondary = SrColors.Ink,
    secondaryContainer = SrColors.Charcoal,
    onSecondaryContainer = Color.White,
    tertiary = SrColors.Signal,
    onTertiary = SrColors.Ink,
    background = SrColors.Slate,
    onBackground = Color.White,
    surface = SrColors.Charcoal,
    onSurface = Color.White,
    surfaceVariant = SrColors.CharcoalDark,
    onSurfaceVariant = SrColors.Mist,
    surfaceContainer = SrColors.Charcoal,
    surfaceContainerHigh = SrColors.Charcoal,
    surfaceContainerHighest = SrColors.CharcoalDark,
    error = SrColors.Danger,
    onError = Color.White,
    outline = SrColors.Mist,
    outlineVariant = SrColors.CharcoalDark,
)

/**
 * The app is dark-only by design: the mockups are, and rescue teams use it outdoors at night.
 */
@Composable
fun SrPortalTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = DarkScheme, typography = Typography(), content = content)
}
