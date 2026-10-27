package com.abertech.srportal.ui.rescue

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.QuestionMark
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.core.TravelMode
import com.abertech.srportal.ui.components.CircleButton
import com.abertech.srportal.ui.components.LabelChip
import com.abertech.srportal.ui.components.PrimaryButton
import com.abertech.srportal.ui.components.SrIcons
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors

/**
 * Mode-of-travel carousel: On Foot, Vehicle, Unknown, with the glow colour from the mockups.
 */
@Composable
fun TravelModeScreen(viewModel: NewRescueViewModel, onConfirm: () -> Unit) {
    val wizard by viewModel.wizard.collectAsStateWithLifecycle()
    val mode = wizard.travelMode
    val glow = when (mode) {
        TravelMode.ON_FOOT -> SrColors.Sun
        TravelMode.VEHICLE -> SrColors.Mist
        TravelMode.UNKNOWN -> SrColors.Sky
    }
    SrScaffold { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding).padding(12.dp)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(18.dp))
                    .border(3.dp, glow.copy(alpha = 0.85f), RoundedCornerShape(18.dp))
                    .background(SrColors.Charcoal)
                    .padding(horizontal = 20.dp, vertical = 28.dp),
                verticalArrangement = Arrangement.SpaceBetween,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(190.dp)
                            .clip(CircleShape)
                            .background(SrColors.Ink)
                            .padding(5.dp)
                            .clip(CircleShape)
                            .background(SrColors.Slate),
                        contentAlignment = Alignment.Center,
                    ) {
                        ModeIcon(mode)
                    }
                    Spacer(modifier = Modifier.height(28.dp))
                    LabelChip(text = modeLabel(mode))
                    Spacer(modifier = Modifier.height(30.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(20.dp)) {
                        ArrowButton(forward = false) { viewModel.cycleTravelMode(-1) }
                        ArrowButton(forward = true) { viewModel.cycleTravelMode(1) }
                    }
                    Spacer(modifier = Modifier.height(18.dp))
                    Text(text = modeHint(mode), color = SrColors.Mist, fontSize = 12.sp)
                }
                PrimaryButton(text = "confirm", onClick = onConfirm)
            }
        }
    }
}

@Composable
private fun ModeIcon(mode: TravelMode) {
    when (mode) {
        TravelMode.ON_FOOT -> SrIcons.Footprints(modifier = Modifier.size(120.dp))
        TravelMode.VEHICLE -> SrIcons.Car(modifier = Modifier.size(130.dp))
        TravelMode.UNKNOWN -> Icon(
            imageVector = Icons.Filled.QuestionMark,
            contentDescription = null,
            tint = SrColors.Ink,
            modifier = Modifier.size(120.dp),
        )
    }
}

@Composable
private fun ArrowButton(forward: Boolean, onClick: () -> Unit) {
    CircleButton(size = 84.dp, onClick = onClick, background = SrColors.Charcoal) {
        Box(
            modifier = Modifier
                .size(76.dp)
                .clip(CircleShape)
                .border(3.dp, SrColors.Ink, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                imageVector = if (forward) Icons.AutoMirrored.Filled.ArrowForward else Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = if (forward) "Next mode" else "Previous mode",
                tint = Color.White,
                modifier = Modifier.size(44.dp),
            )
        }
    }
}

private fun modeLabel(mode: TravelMode): String = when (mode) {
    TravelMode.ON_FOOT -> "On Foot"
    TravelMode.VEHICLE -> "Vehicle"
    TravelMode.UNKNOWN -> "Unknown"
}

private fun modeHint(mode: TravelMode): String = when (mode) {
    TravelMode.ON_FOOT -> "Walking displacement model, saturates over the first day"
    TravelMode.VEHICLE -> "Road-reach model, capped at the vehicle's plausible range"
    TravelMode.UNKNOWN -> "Blend of both models with wider uncertainty"
}
