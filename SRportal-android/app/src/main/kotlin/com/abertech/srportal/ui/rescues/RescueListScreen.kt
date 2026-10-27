package com.abertech.srportal.ui.rescues

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.RescueStatus
import com.abertech.srportal.core.SearchWindowCalculator
import com.abertech.srportal.core.TimeFormat
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.theme.SrColors

/**
 * Ongoing or completed cases, newest first.
 */
@Composable
fun RescueListScreen(status: RescueStatus, onOpen: (String) -> Unit, onBack: () -> Unit) {
    val container = LocalAppContainer.current
    val rescues by container.repository.rescues.collectAsStateWithLifecycle()
    val visible = rescues.filter { it.status == status }
    val now = container.clock()
    SrScaffold(topBar = { ListTopBar(if (status == RescueStatus.COMPLETED) "Completed Rescues" else "Ongoing Rescues", onBack) }) { padding ->
        if (visible.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(text = "No ${status.name.lowercase()} rescues yet", color = SrColors.Mist)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                items(visible, key = { it.id }) { rescue ->
                    val lastSeen = TimeFormat.parseOrNull(rescue.lastSeenUtc) ?: now
                    RescueCard(rescue, SearchWindowCalculator.elapsedMinutes(lastSeen, now)) { onOpen(rescue.id) }
                }
            }
        }
    }
}

@Composable
private fun ListTopBar(title: String, onBack: () -> Unit) {
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
        Text(text = title, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun RescueCard(rescue: Rescue, elapsedMinutes: Long, onClick: () -> Unit) {
    val plan = rescue.plan
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(SrColors.Charcoal)
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(if (rescue.status == RescueStatus.COMPLETED) SrColors.Signal else SrColors.Amber),
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = rescue.locationLabel.ifBlank { "%.4f, %.4f".format(rescue.lastKnownLocation.lat, rescue.lastKnownLocation.lon) },
                color = Color.White,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = listOfNotNull(
                rescue.subject.name.ifBlank { null },
                rescue.travelMode.name.lowercase().replace('_', ' '),
                "last seen " + (TimeFormat.parseOrNull(rescue.lastSeenUtc)?.let { TimeFormat.human(it, rescue.timeZone) } ?: rescue.lastSeenUtc),
            ).joinToString("  ·  "),
            color = SrColors.Mist,
            fontSize = 12.sp,
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = if (plan != null) {
                "%s elapsed  ·  %d searchers  ·  %d source%s with data".format(
                    TimeFormat.elapsed(elapsedMinutes),
                    plan.team.searchers,
                    plan.dataSources.count { it.available },
                    if (plan.dataSources.count { it.available } == 1) "" else "s",
                )
            } else {
                TimeFormat.elapsed(elapsedMinutes) + " elapsed  ·  model not run yet"
            },
            color = SrColors.Lavender,
            fontSize = 12.sp,
        )
    }
}
