package com.abertech.srportal.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DoneAll
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.abertech.srportal.ui.components.CircleButton
import com.abertech.srportal.ui.components.LabelChip
import com.abertech.srportal.ui.components.LoadingRing
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors

/**
 * The four-button home screen: New, Ongoing, Completed, Settings.
 */
@Composable
fun HomeScreen(
    onNewRescue: () -> Unit,
    onOngoing: () -> Unit,
    onCompleted: () -> Unit,
    onSettings: () -> Unit,
) {
    SrScaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.SpaceEvenly,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                HomeAction(label = "New Rescue", onClick = onNewRescue) {
                    Icon(imageVector = Icons.Filled.Add, contentDescription = null, tint = SrColors.Mist, modifier = Modifier.size(64.dp))
                }
                HomeAction(label = "Ongoing Rescues", onClick = onOngoing) {
                    LoadingRing(modifier = Modifier.size(56.dp), strokeWidth = 7.dp)
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                HomeAction(label = "Completed Rescues", onClick = onCompleted) {
                    Icon(imageVector = Icons.Filled.DoneAll, contentDescription = null, tint = SrColors.Mist, modifier = Modifier.size(64.dp))
                }
                HomeAction(label = "Settings", onClick = onSettings) {
                    Icon(imageVector = Icons.Filled.Settings, contentDescription = null, tint = SrColors.Mist, modifier = Modifier.size(64.dp))
                }
            }
        }
    }
}

@Composable
private fun HomeAction(label: String, onClick: () -> Unit, content: @Composable () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        CircleButton(size = 148.dp, onClick = onClick) { content() }
        Spacer(modifier = Modifier.height(28.dp))
        LabelChip(text = label)
    }
}
