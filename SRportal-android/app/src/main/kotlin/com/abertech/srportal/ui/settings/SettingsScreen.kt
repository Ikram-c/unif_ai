package com.abertech.srportal.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.ui.components.SectionCard
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors
import kotlinx.coroutines.launch

/**
 * Server URL, demo-mode switch, default time zone and a short description of the pipeline.
 */
@Composable
fun SettingsScreen(onBack: () -> Unit) {
    val container = LocalAppContainer.current
    val settings by container.settings.settings.collectAsStateWithLifecycle()
    val status by container.health.status.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    var urlDraft by remember { mutableStateOf(settings.baseUrl) }
    var testResult by remember { mutableStateOf<String?>(null) }

    SrScaffold(topBar = { SettingsTopBar(onBack) }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            SectionCard(title = "Cloud server") {
                OutlinedTextField(
                    value = urlDraft,
                    onValueChange = { urlDraft = it },
                    label = { Text("Base URL") },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = SrColors.Lavender,
                        unfocusedBorderColor = SrColors.Mist,
                        focusedLabelColor = SrColors.Lavender,
                        unfocusedLabelColor = SrColors.Mist,
                        cursorColor = SrColors.Lavender,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SmallButton(text = "Save & test") {
                        container.settings.update { it.copy(baseUrl = urlDraft.trim()) }
                        scope.launch {
                            val outcome = container.health.checkOnce()
                            testResult = outcome.detail
                            container.repository.mergeFromServer()
                        }
                    }
                    SmallButton(text = "Emulator default") { urlDraft = "http://10.0.2.2:8000/" }
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = testResult ?: status.detail, color = SrColors.Mist, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Emulator: 10.0.2.2 is the host machine. Physical phone: use the laptop's LAN IP, e.g. http://192.168.1.20:8000/",
                    color = SrColors.Mist.copy(alpha = 0.8f),
                    fontSize = 11.sp,
                )
            }
            SectionCard(title = "Demo mode") {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "Force demo data", color = Color.White, fontSize = 14.sp)
                        Text(text = "Ignore the server and use the bundled dataset", color = SrColors.Mist, fontSize = 11.sp)
                    }
                    Switch(
                        checked = settings.forceDemo,
                        onCheckedChange = { checked ->
                            container.settings.update { it.copy(forceDemo = checked) }
                            scope.launch { container.health.checkOnce() }
                        },
                    )
                }
            }
            SectionCard(title = "Default time zone") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    for (zone in listOf("UTC", "Europe/London", java.util.TimeZone.getDefault().id).distinct()) {
                        FilterChip(
                            selected = settings.timeZone == zone,
                            onClick = { container.settings.update { it.copy(timeZone = zone) } },
                            label = { Text(zone.substringAfterLast('/')) },
                        )
                    }
                }
            }
            SectionCard(title = "How the model works") {
                Text(
                    text = "Pin + confirmed last-seen time give the search window (now minus last seen). " +
                        "The window bounds a metadata query over indexed satellite scenes, UAV flights and dashcam passes; " +
                        "each hit carries the OME-Zarr store and frame index so the small-object detector opens only that chunk. " +
                        "The travel mode and subject profile size the wander rings, hex cells inside them are scored, " +
                        "weather at the pin decides which equipment can fly or deploy, and sweep rates turn the priority cells into a team size.",
                    color = SrColors.Mist,
                    fontSize = 12.sp,
                )
            }
            Text(text = "SR Portal MVP · Designed by AberTech", color = SrColors.Mist, fontSize = 11.sp, modifier = Modifier.padding(bottom = 16.dp))
        }
    }
}

@Composable
private fun SettingsTopBar(onBack: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SrColors.Slate)
            .statusBarsPadding()
            .padding(start = 4.dp, end = 12.dp, top = 4.dp, bottom = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        IconButton(onClick = onBack) {
            Icon(imageVector = Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
        }
        Text(text = "Settings", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SmallButton(text: String, onClick: () -> Unit) {
    Text(
        text = text,
        color = SrColors.Ink,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(SrColors.Lavender)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
    )
}
