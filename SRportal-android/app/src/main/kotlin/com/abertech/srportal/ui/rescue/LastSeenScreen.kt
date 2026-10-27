package com.abertech.srportal.ui.rescue

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.core.TimeFormat
import com.abertech.srportal.ui.components.AberTechHeader
import com.abertech.srportal.ui.components.PrimaryButton
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneOffset

/**
 * "Last Seen Date/Time": big clock, inline calendar, time-zone toggle.
 *
 * The confirmed instant is what the search window is measured from.
 */
@Composable
fun LastSeenScreen(viewModel: NewRescueViewModel, onConfirm: () -> Unit) {
    val wizard by viewModel.wizard.collectAsStateWithLifecycle()
    var showTimeDialog by remember { mutableStateOf(false) }
    val todayUtcMillis = remember { LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli() }
    val dateState = rememberDatePickerState(
        initialSelectedDateMillis = wizard.lastSeenDate.atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli(),
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean = utcTimeMillis < todayUtcMillis
        },
    )
    LaunchedEffect(dateState.selectedDateMillis) {
        val millis = dateState.selectedDateMillis ?: return@LaunchedEffect
        val date = Instant.ofEpochMilli(millis).atZone(ZoneOffset.UTC).toLocalDate()
        if (date != wizard.lastSeenDate) viewModel.setDate(date)
    }
    val inFuture = viewModel.lastSeenIsInFuture()
    val elapsed = viewModel.elapsedMinutes()

    SrScaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            AberTechHeader()
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "Last Seen Date/Time", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(14.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(SrColors.Charcoal)
                    .clickable { showTimeDialog = true }
                    .padding(vertical = 18.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = "%02d:%02d".format(wizard.lastSeenTime.hour, wizard.lastSeenTime.minute),
                    color = SrColors.Ink,
                    fontSize = 64.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(SrColors.Mist)
                        .padding(horizontal = 28.dp, vertical = 4.dp),
                )
            }
            Spacer(modifier = Modifier.height(14.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(SrColors.Charcoal)
                    .padding(8.dp),
            ) {
                DatePicker(
                    state = dateState,
                    showModeToggle = false,
                    title = null,
                    headline = null,
                    colors = DatePickerDefaults.colors(
                        containerColor = SrColors.Lavender,
                        selectedDayContainerColor = SrColors.Violet,
                        todayDateBorderColor = SrColors.Violet,
                        todayContentColor = SrColors.Ink,
                        dayContentColor = SrColors.Ink,
                        weekdayContentColor = SrColors.Ink,
                        navigationContentColor = SrColors.Ink,
                        yearContentColor = SrColors.Ink,
                        subheadContentColor = SrColors.Ink,
                        disabledDayContentColor = SrColors.Ink.copy(alpha = 0.3f),
                    ),
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(text = "Time-Zone", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(SrColors.Mist)
                    .clickable { viewModel.cycleTimeZone() }
                    .padding(horizontal = 26.dp, vertical = 12.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text(text = wizard.timeZone.substringAfterLast('/'), color = SrColors.Ink, fontSize = 30.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = if (inFuture) "That moment is in the future; pick an earlier time" else "Search window so far: " + TimeFormat.elapsed(elapsed),
                color = if (inFuture) SrColors.Danger else SrColors.Mist,
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(16.dp))
            PrimaryButton(text = "confirm", onClick = onConfirm, enabled = !inFuture)
            Spacer(modifier = Modifier.height(16.dp))
        }
    }

    if (showTimeDialog) {
        TimeDialog(
            initial = wizard.lastSeenTime,
            onDismiss = { showTimeDialog = false },
            onConfirm = { time ->
                viewModel.setTime(time)
                showTimeDialog = false
            },
        )
    }
}

@Composable
private fun TimeDialog(initial: LocalTime, onDismiss: () -> Unit, onConfirm: (LocalTime) -> Unit) {
    val timeState = rememberTimePickerState(initialHour = initial.hour, initialMinute = initial.minute, is24Hour = true)
    AlertDialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
        modifier = Modifier.padding(horizontal = 16.dp),
        confirmButton = {
            TextButton(onClick = { onConfirm(LocalTime.of(timeState.hour, timeState.minute)) }) { Text("Set") }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        },
        title = { Text("Last seen time") },
        text = { TimePicker(state = timeState) },
    )
}
