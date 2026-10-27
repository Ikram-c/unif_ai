package com.abertech.srportal.ui.rescue

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.core.Experience
import com.abertech.srportal.core.Fitness
import com.abertech.srportal.core.SubjectProfile
import com.abertech.srportal.ui.components.AberTechHeader
import com.abertech.srportal.ui.components.CircleButton
import com.abertech.srportal.ui.components.LoadingRing
import com.abertech.srportal.ui.components.PrimaryButton
import com.abertech.srportal.ui.components.SrIcons
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors

/**
 * "Begin AI Model" with the optional subject-profile sheet.
 *
 * Tapping the mountain sends the case to the backend and, when the plan is back, opens results.
 */
@Composable
fun BeginModelScreen(viewModel: NewRescueViewModel, onPlanReady: (String) -> Unit) {
    val wizard by viewModel.wizard.collectAsStateWithLifecycle()
    var showSheet by remember { mutableStateOf(false) }

    SrScaffold { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            AberTechHeader()
            Spacer(modifier = Modifier.height(28.dp))
            Text(text = "Begin AI Model", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(28.dp))
            Box(contentAlignment = Alignment.Center) {
                CircleButton(size = 200.dp, onClick = { viewModel.beginModel(onPlanReady) }, enabled = !wizard.running) {
                    Box(
                        modifier = Modifier
                            .size(170.dp)
                            .clip(CircleShape)
                            .background(SrColors.Slate),
                        contentAlignment = Alignment.Center,
                    ) {
                        SrIcons.Mountain(modifier = Modifier.size(160.dp))
                    }
                }
                if (wizard.running) {
                    LoadingRing(modifier = Modifier.size(214.dp), strokeWidth = 10.dp, spinning = true)
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
            Text(
                text = when {
                    wizard.running -> wizard.progress
                    wizard.error != null -> wizard.error ?: ""
                    else -> "Pin, ${modeText(wizard)}, last seen ${"%02d:%02d".format(wizard.lastSeenTime.hour, wizard.lastSeenTime.minute)} ${wizard.timeZone.substringAfterLast('/')}"
                },
                color = if (wizard.error != null) SrColors.Danger else SrColors.Mist,
                fontSize = 13.sp,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(48.dp))
            Text(text = "Add Additional User info", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            CircleButton(size = 110.dp, onClick = { showSheet = true }, background = SrColors.Slate) {
                Icon(imageVector = Icons.Filled.Add, contentDescription = "Add subject details", tint = SrColors.Mist, modifier = Modifier.size(60.dp))
            }
            Spacer(modifier = Modifier.height(10.dp))
            Text(text = subjectSummary(wizard.subject), color = SrColors.Mist, fontSize = 12.sp, textAlign = TextAlign.Center)
            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    if (showSheet) {
        SubjectSheet(
            subject = wizard.subject,
            onChange = { transform -> viewModel.updateSubject(transform) },
            onDismiss = { showSheet = false },
        )
    }
}

@Composable
private fun SubjectSheet(subject: SubjectProfile, onChange: ((SubjectProfile) -> SubjectProfile) -> Unit, onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, containerColor = SrColors.Charcoal) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(text = "Missing person", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(
                text = "These characteristics weight the wander model now and feed the causal / A* model later.",
                color = SrColors.Mist,
                fontSize = 12.sp,
            )
            SheetField(label = "Name or description", value = subject.name) { text -> onChange { it.copy(name = text) } }
            SheetField(label = "Age", value = subject.age?.toString() ?: "", keyboardType = KeyboardType.Number) { text ->
                onChange { it.copy(age = text.toIntOrNull()) }
            }
            Text(text = "Fitness", color = Color.White, fontSize = 14.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (option in Fitness.values()) {
                    FilterChip(
                        selected = subject.fitness == option,
                        onClick = { onChange { it.copy(fitness = option) } },
                        label = { Text(option.name.lowercase().replaceFirstChar { c -> c.uppercase() }) },
                    )
                }
            }
            Text(text = "Experience", color = Color.White, fontSize = 14.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (option in Experience.values()) {
                    FilterChip(
                        selected = subject.experience == option,
                        onClick = { onChange { it.copy(experience = option) } },
                        label = { Text(option.name.lowercase().replaceFirstChar { c -> c.uppercase() }) },
                    )
                }
            }
            SheetField(label = "Clothing / vehicle", value = subject.clothing) { text -> onChange { it.copy(clothing = text) } }
            SheetField(label = "Notes", value = subject.notes, singleLine = false) { text -> onChange { it.copy(notes = text) } }
            PrimaryButton(text = "done", onClick = onDismiss)
        }
    }
}

@Composable
private fun SheetField(
    label: String,
    value: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    onValueChange: (String) -> Unit,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = singleLine,
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
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
}

private fun modeText(wizard: WizardState): String = wizard.travelMode.name.lowercase().replace('_', ' ')

private fun subjectSummary(subject: SubjectProfile): String {
    val parts = ArrayList<String>(4)
    if (subject.name.isNotBlank()) parts.add(subject.name)
    subject.age?.let { parts.add("age $it") }
    parts.add("fitness ${subject.fitness.name.lowercase()}")
    parts.add("${subject.experience.name.lowercase()} experience")
    return parts.joinToString(", ")
}
