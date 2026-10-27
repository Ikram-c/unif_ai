package com.abertech.srportal.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawStyle
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import com.abertech.srportal.ui.theme.SrColors

/**
 * Hand-drawn icons matching the mockups (satellite, drone, footprints, mountain).
 *
 * Drawn with primitives rather than path data so they scale cleanly and need no assets.
 */
object SrIcons {
    /**
     * Satellite: rotated body with two solar panels and a dish.
     */
    @Composable
    fun Satellite(modifier: Modifier = Modifier, tint: Color = SrColors.Mist, filled: Boolean = false) {
        Canvas(modifier = modifier) {
            val s = size.minDimension
            val stroke = Stroke(width = s * 0.06f, cap = StrokeCap.Round)
            val style: DrawStyle = if (filled) Fill else stroke
            rotate(degrees = 45f) {
                val body = Size(s * 0.22f, s * 0.34f)
                drawRoundRect(
                    color = tint,
                    topLeft = Offset(center.x - body.width / 2, center.y - body.height / 2),
                    size = body,
                    cornerRadius = CornerRadius(s * 0.04f),
                    style = style,
                )
                val panel = Size(s * 0.16f, s * 0.26f)
                val gap = s * 0.30f
                for (sign in listOf(-1f, 1f)) {
                    drawLine(tint, Offset(center.x, center.y + sign * body.height / 2), Offset(center.x, center.y + sign * gap * 0.85f), stroke.width)
                    drawRoundRect(
                        color = tint,
                        topLeft = Offset(center.x - panel.width / 2, center.y + sign * gap - panel.height / 2 + (if (sign > 0) panel.height * 0.35f else -panel.height * 0.35f)),
                        size = panel,
                        cornerRadius = CornerRadius(s * 0.03f),
                        style = style,
                    )
                }
                drawArc(
                    color = tint,
                    startAngle = 200f,
                    sweepAngle = 140f,
                    useCenter = false,
                    topLeft = Offset(center.x + s * 0.12f, center.y - s * 0.40f),
                    size = Size(s * 0.30f, s * 0.30f),
                    style = stroke,
                )
                drawLine(tint, Offset(center.x + s * 0.11f, center.y - s * 0.17f), Offset(center.x + s * 0.27f, center.y - s * 0.25f), stroke.width)
            }
        }
    }

    /**
     * Quadcopter seen from above.
     */
    @Composable
    fun Drone(modifier: Modifier = Modifier, tint: Color = SrColors.Mist) {
        Canvas(modifier = modifier) {
            val s = size.minDimension
            val strokeWidth = s * 0.06f
            val armLength = s * 0.30f
            for (angle in listOf(45f, 135f, 225f, 315f)) {
                val rad = Math.toRadians(angle.toDouble())
                val end = Offset(center.x + (armLength * Math.cos(rad)).toFloat(), center.y + (armLength * Math.sin(rad)).toFloat())
                drawLine(tint, center, end, strokeWidth, StrokeCap.Round)
                drawCircle(tint, radius = s * 0.13f, center = end, style = Stroke(strokeWidth * 0.8f))
            }
            drawRoundRect(
                color = tint,
                topLeft = Offset(center.x - s * 0.13f, center.y - s * 0.09f),
                size = Size(s * 0.26f, s * 0.18f),
                cornerRadius = CornerRadius(s * 0.05f),
            )
        }
    }

    /**
     * Two shoe prints, the "On Foot" mode icon.
     */
    @Composable
    fun Footprints(modifier: Modifier = Modifier, tint: Color = SrColors.Ink) {
        Canvas(modifier = modifier) {
            val s = size.minDimension
            for ((index, sign) in listOf(-1f, 1f).withIndex()) {
                val cx = center.x + sign * s * 0.18f
                val cy = center.y + (if (index == 0) s * 0.06f else -s * 0.10f)
                drawOval(tint, topLeft = Offset(cx - s * 0.11f, cy - s * 0.26f), size = Size(s * 0.22f, s * 0.34f))
                drawOval(tint, topLeft = Offset(cx - s * 0.09f, cy + s * 0.12f), size = Size(s * 0.18f, s * 0.14f))
            }
        }
    }

    /**
     * Mountain ridge silhouette for the "Begin AI Model" button.
     */
    @Composable
    fun Mountain(modifier: Modifier = Modifier, tint: Color = SrColors.CharcoalDark, snow: Color = SrColors.Mist) {
        Canvas(modifier = modifier) {
            val s = size.minDimension
            val baseY = center.y + s * 0.28f
            val ridge = Path().apply {
                moveTo(center.x - s * 0.48f, baseY)
                lineTo(center.x - s * 0.20f, center.y - s * 0.22f)
                lineTo(center.x - s * 0.05f, center.y + s * 0.02f)
                lineTo(center.x + s * 0.14f, center.y - s * 0.32f)
                lineTo(center.x + s * 0.48f, baseY)
                close()
            }
            drawPath(ridge, tint)
            val cap = Path().apply {
                moveTo(center.x + s * 0.14f, center.y - s * 0.32f)
                lineTo(center.x + s * 0.05f, center.y - s * 0.14f)
                lineTo(center.x + s * 0.12f, center.y - s * 0.10f)
                lineTo(center.x + s * 0.20f, center.y - s * 0.16f)
                lineTo(center.x + s * 0.24f, center.y - s * 0.14f)
                close()
            }
            drawPath(cap, snow)
        }
    }

    /**
     * Front view of a car, the "Vehicle" mode icon.
     */
    @Composable
    fun Car(modifier: Modifier = Modifier, tint: Color = SrColors.Ink) {
        Canvas(modifier = modifier) {
            val s = size.minDimension
            drawRoundRect(
                color = tint,
                topLeft = Offset(center.x - s * 0.36f, center.y - s * 0.06f),
                size = Size(s * 0.72f, s * 0.30f),
                cornerRadius = CornerRadius(s * 0.08f),
            )
            val cabin = Path().apply {
                moveTo(center.x - s * 0.24f, center.y - s * 0.06f)
                lineTo(center.x - s * 0.16f, center.y - s * 0.26f)
                lineTo(center.x + s * 0.16f, center.y - s * 0.26f)
                lineTo(center.x + s * 0.24f, center.y - s * 0.06f)
                close()
            }
            drawPath(cabin, tint)
            for (sign in listOf(-1f, 1f)) {
                drawCircle(tint, radius = s * 0.08f, center = Offset(center.x + sign * s * 0.24f, center.y + s * 0.26f))
            }
        }
    }
}
