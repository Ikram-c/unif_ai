package com.abertech.srportal.ui.rescue

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.ui.components.CircleButton
import com.abertech.srportal.ui.components.LabelChip
import com.abertech.srportal.ui.components.PrimaryButton
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors

/**
 * First wizard step: a single pin button that opens the map picker.
 */
@Composable
fun LocationStepScreen(viewModel: NewRescueViewModel, onOpenMap: () -> Unit, onConfirm: () -> Unit) {
    val wizard by viewModel.wizard.collectAsStateWithLifecycle()
    val pin = wizard.pin
    SrScaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            CircleButton(size = 170.dp, onClick = onOpenMap) {
                Icon(
                    imageVector = Icons.Filled.LocationOn,
                    contentDescription = "Open map",
                    tint = SrColors.Mist,
                    modifier = Modifier.size(120.dp),
                )
            }
            Spacer(modifier = Modifier.height(36.dp))
            LabelChip(text = "Last Known Location")
            Spacer(modifier = Modifier.height(20.dp))
            if (pin != null) {
                Text(
                    text = wizard.locationLabel.ifBlank { "%.5f, %.5f".format(pin.lat, pin.lon) },
                    color = SrColors.Mist,
                    fontSize = 14.sp,
                )
                Spacer(modifier = Modifier.height(24.dp))
                PrimaryButton(text = "confirm", onClick = onConfirm)
            } else {
                Text(text = "Tap the pin to open the map and drop the last known location", color = SrColors.Mist, fontSize = 13.sp)
            }
        }
    }
}
