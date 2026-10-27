package com.abertech.srportal.ui.results

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Snackbar
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.abertech.srportal.core.DataSourceAvailability
import com.abertech.srportal.core.DataSourceKind
import com.abertech.srportal.core.DetectionStatus
import com.abertech.srportal.core.EquipmentKind
import com.abertech.srportal.core.Geo
import com.abertech.srportal.core.Observation
import com.abertech.srportal.core.Rescue
import com.abertech.srportal.core.RescueStatus
import com.abertech.srportal.core.SearchPlan
import com.abertech.srportal.core.TimeFormat
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.di.SarViewModelFactory
import com.abertech.srportal.ui.components.KeyValueRow
import com.abertech.srportal.ui.components.SectionCard
import com.abertech.srportal.ui.components.SrIcons
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.map.MapOverlays
import com.abertech.srportal.ui.map.OsmMap
import com.abertech.srportal.ui.theme.SrColors
import org.osmdroid.views.MapView

/**
 * The plan for one rescue: available-data chips, map with rings and priority cells, and the
 * recommendation cards (where to look, equipment, team size, imagery to run the detector on).
 */
@Composable
fun ResultsScreen(rescueId: String, onBack: () -> Unit) {
    val container = LocalAppContainer.current
    val viewModel: ResultsViewModel = viewModel(
        key = "results:$rescueId",
        factory = SarViewModelFactory { ResultsViewModel(container, rescueId) },
    )
    val rescue by viewModel.rescue.collectAsStateWithLifecycle()
    val busy by viewModel.busy.collectAsStateWithLifecycle()
    val message by viewModel.message.collectAsStateWithLifecycle()

    SrScaffold(topBar = { ResultsTopBar(rescue, onBack) }) { padding ->
        val current = rescue
        val plan = current?.plan
        if (current == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Text(text = "Rescue not found", color = Color.White)
            }
        } else if (plan == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = SrColors.Lavender)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "Running the model for this case", color = SrColors.Mist, fontSize = 13.sp)
                }
            }
        } else {
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                AvailableDataRow(plan.dataSources)
                PlanMap(current, plan, modifier = Modifier.fillMaxWidth().height(300.dp))
                PlanDetails(
                    rescue = current,
                    plan = plan,
                    busy = busy,
                    onTrigger = { viewModel.triggerDetection(it) },
                    onRerun = { viewModel.rerun() },
                    onToggleCompleted = { viewModel.toggleCompleted() },
                    modifier = Modifier.weight(1f),
                )
            }
        }
        val text = message
        if (text != null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.BottomCenter) {
                Snackbar(
                    modifier = Modifier.padding(12.dp),
                    action = { TextButton(onClick = { viewModel.dismissMessage() }) { Text("OK") } },
                ) { Text(text) }
            }
        }
    }
}

@Composable
private fun ResultsTopBar(rescue: Rescue?, onBack: () -> Unit) {
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
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = rescue?.locationLabel?.ifBlank { null } ?: rescue?.subject?.name?.ifBlank { null } ?: "Rescue",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            if (rescue != null) {
                Text(
                    text = rescue.status.name.lowercase().replaceFirstChar { it.uppercase() } + " · " + rescue.travelMode.name.lowercase().replace('_', ' '),
                    color = SrColors.Mist,
                    fontSize = 12.sp,
                )
            }
        }
    }
}

/**
 * The three "Available Data" circles: green ring when the window holds imagery from that source.
 */
@Composable
private fun AvailableDataRow(sources: List<DataSourceAvailability>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(SrColors.Charcoal)
            .padding(vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
            for (kind in listOf(DataSourceKind.SATELLITE, DataSourceKind.DASHCAM, DataSourceKind.UAV)) {
                val entry = sources.firstOrNull { it.source == kind }
                val available = entry?.available == true
                val count = entry?.observations?.size ?: 0
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(74.dp)
                            .clip(CircleShape)
                            .border(5.dp, if (available) SrColors.Signal else SrColors.Slate, CircleShape)
                            .padding(7.dp)
                            .clip(CircleShape)
                            .background(SrColors.Slate),
                        contentAlignment = Alignment.Center,
                    ) {
                        SourceIcon(kind, modifier = Modifier.size(44.dp))
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = if (available) "$count in window" else "none", color = if (available) SrColors.Signal else SrColors.Mist, fontSize = 11.sp)
                }
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Available Data",
            color = Color.White,
            fontSize = 11.sp,
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(SrColors.CharcoalDark)
                .padding(horizontal = 8.dp, vertical = 3.dp),
        )
    }
}

@Composable
private fun SourceIcon(kind: DataSourceKind, modifier: Modifier = Modifier) {
    when (kind) {
        DataSourceKind.SATELLITE -> SrIcons.Satellite(modifier = modifier, tint = SrColors.Mist)
        DataSourceKind.DASHCAM -> SrIcons.Car(modifier = modifier, tint = SrColors.Ink)
        DataSourceKind.UAV -> SrIcons.Drone(modifier = modifier, tint = SrColors.Ink)
    }
}

/**
 * Map with the pin, the three probability rings, the priority cells and imagery footprints.
 */
@Composable
private fun PlanMap(rescue: Rescue, plan: SearchPlan, modifier: Modifier = Modifier) {
    val renderedKey = remember { arrayOf<String?>(null) }
    val key = rescue.id + ":" + plan.generatedAtUtc
    Box(modifier = modifier.padding(horizontal = 12.dp, vertical = 8.dp).clip(RoundedCornerShape(16.dp))) {
        OsmMap(
            modifier = Modifier.fillMaxSize(),
            initialCentre = rescue.lastKnownLocation,
            initialZoom = 11.0,
            update = { map ->
                if (renderedKey[0] != key) {
                    renderPlan(map, rescue, plan)
                    renderedKey[0] = key
                }
            },
        )
        MapLegend(modifier = Modifier.align(Alignment.BottomStart).padding(8.dp))
    }
}

private fun renderPlan(map: MapView, rescue: Rescue, plan: SearchPlan) {
    MapOverlays.clear(map)
    val pin = rescue.lastKnownLocation
    val ringColours = listOf(0.28f, 0.16f, 0.08f)
    for ((index, ring) in plan.rings.sortedByDescending { it.radiusM }.withIndex()) {
        val alpha = ringColours.getOrElse(2 - index.coerceAtMost(2)) { 0.08f }
        MapOverlays.addCircle(
            map,
            pin,
            ring.radiusM,
            strokeColour = SrColors.Lavender.copy(alpha = 0.9f).toArgb(),
            fillColour = SrColors.Violet.copy(alpha = alpha).toArgb(),
            strokeWidthPx = 3f,
        )
    }
    val topScore = plan.regions.firstOrNull()?.score ?: 1.0
    for (region in plan.regions) {
        val strength = (region.score / topScore).coerceIn(0.15, 1.0).toFloat()
        MapOverlays.addPolygon(
            map,
            region.cell.boundary,
            strokeColour = SrColors.Sun.copy(alpha = 0.9f).toArgb(),
            fillColour = SrColors.Sun.copy(alpha = 0.12f + 0.38f * strength).toArgb(),
            strokeWidthPx = 2f,
            title = "#${region.rank} ${region.sector} ${region.cell.terrain.name.lowercase()}",
        )
    }
    for (source in plan.dataSources) {
        val colour = sourceColour(source.source)
        for (observation in source.observations.take(MAX_FOOTPRINTS_PER_SOURCE)) {
            if (source.source == DataSourceKind.SATELLITE) continue
            MapOverlays.addPolygon(
                map,
                observation.footprint,
                strokeColour = colour.copy(alpha = 0.95f).toArgb(),
                fillColour = colour.copy(alpha = 0.25f).toArgb(),
                strokeWidthPx = 2f,
                title = observation.platformId,
            )
        }
    }
    MapOverlays.addPin(map, pin, rescue.locationLabel.ifBlank { "Last known location" })
    val outer = plan.rings.maxOfOrNull { it.radiusM } ?: 1_000.0
    MapOverlays.fit(map, Geo.circle(pin, outer, 12))
    map.invalidate()
}

@Composable
private fun MapLegend(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(SrColors.CharcoalDark.copy(alpha = 0.85f))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        LegendRow(SrColors.Violet, "50 / 75 / 95 % rings")
        LegendRow(SrColors.Sun, "priority cells")
        LegendRow(SrColors.Dashcam, "dashcam pass")
        LegendRow(SrColors.Uav, "UAV strip")
    }
}

@Composable
private fun LegendRow(colour: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(colour))
        Spacer(modifier = Modifier.width(6.dp))
        Text(text = label, color = Color.White, fontSize = 10.sp)
    }
}

/**
 * The scrolling recommendation cards under the map.
 */
@Composable
private fun PlanDetails(
    rescue: Rescue,
    plan: SearchPlan,
    busy: Boolean,
    onTrigger: (String) -> Unit,
    onRerun: () -> Unit,
    onToggleCompleted: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionCard(title = "Search window") {
                KeyValueRow("Last seen", TimeFormat.human(TimeFormat.parse(plan.window.lastSeenUtc), rescue.timeZone))
                KeyValueRow("Model run", TimeFormat.human(TimeFormat.parse(plan.window.nowUtc), rescue.timeZone))
                KeyValueRow("Elapsed (delta t)", TimeFormat.elapsed(plan.window.elapsedMinutes), SrColors.Lavender)
                for (ring in plan.rings) {
                    KeyValueRow("%.0f %% within".format(ring.probability * 100), formatDistance(ring.radiusM))
                }
                KeyValueRow("Cells", plan.cellSource + " (" + plan.regions.size + " priority)")
                KeyValueRow("Confidence", plan.confidence.name, confidenceColour(plan.confidence.name))
            }
        }
        item {
            SectionCard(title = "Where to look first") {
                for (sector in plan.sectors.take(4)) {
                    KeyValueRow(
                        "${sector.sector}  ·  ${sector.dominantTerrain.name.lowercase().replace('_', ' ')}",
                        "%.0f %%  ·  %.1f km²".format(sector.probability * 100, sector.areaKm2),
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = "Priority cells", color = SrColors.Mist, fontSize = 12.sp)
                for (region in plan.regions.take(6)) {
                    KeyValueRow(
                        "#${region.rank}  ${region.sector}  ${formatDistance(region.distanceM)}",
                        "%.1f %%  ·  %s".format(region.score * 100, region.cell.terrain.name.lowercase().replace('_', ' ')),
                    )
                }
            }
        }
        item {
            SectionCard(title = "Equipment viability") {
                KeyValueRow(
                    "Weather (" + plan.weather.source + ")",
                    "%.0f m/s, %.1f mm/h, vis %.1f km, %s".format(
                        plan.weather.windMs,
                        plan.weather.precipitationMmH,
                        plan.weather.visibilityM / 1000.0,
                        if (plan.weather.daylight) "daylight" else "dark",
                    ),
                )
                Spacer(modifier = Modifier.height(4.dp))
                for (item in plan.equipment) {
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(if (item.viable) SrColors.Signal else SrColors.Danger),
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(text = equipmentLabel(item.kind), color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            Text(text = item.reason, color = SrColors.Mist, fontSize = 11.sp)
                        }
                    }
                }
            }
        }
        item {
            SectionCard(title = "Search party") {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "${plan.team.searchers}", color = SrColors.Lavender, fontSize = 40.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(text = "searchers in ${plan.team.teams} team${if (plan.team.teams == 1) "" else "s"}", color = Color.White, fontSize = 14.sp)
                        Text(text = "%.1f km² in %.0f h · confidence %s".format(plan.team.searchAreaKm2, plan.team.targetHours, plan.team.confidence.name.lowercase()), color = SrColors.Mist, fontSize = 12.sp)
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(text = plan.team.rationale, color = SrColors.Mist, fontSize = 11.sp)
            }
        }
        for (source in plan.dataSources) {
            item {
                SectionCard(title = sourceTitle(source.source) + if (source.available) "  ·  ${source.observations.size}" else "  ·  none in window") {
                    if (source.observations.isEmpty()) {
                        Text(text = "No indexed ${sourceTitle(source.source).lowercase()} metadata between last-seen and now.", color = SrColors.Mist, fontSize = 12.sp)
                    }
                    for (observation in source.observations.take(MAX_LISTED_OBSERVATIONS)) {
                        ObservationRow(observation, rescue.timeZone, busy, onTrigger)
                    }
                }
            }
        }
        item {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                ActionButton(text = "Re-run model", enabled = !busy, onClick = onRerun)
                ActionButton(
                    text = if (rescue.status == RescueStatus.COMPLETED) "Reopen case" else "Mark completed",
                    enabled = !busy,
                    onClick = onToggleCompleted,
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
private fun ObservationRow(observation: Observation, zone: String, busy: Boolean, onTrigger: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(SrColors.CharcoalDark)
            .padding(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(sourceColour(observation.source)))
            Spacer(modifier = Modifier.width(8.dp))
            Text(text = observation.platformId, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
            Text(text = TimeFormat.parseOrNull(observation.observedAtUtc)?.let { TimeFormat.human(it, zone) } ?: observation.observedAtUtc, color = SrColors.Mist, fontSize = 11.sp)
        }
        val details = ArrayList<String>(4)
        if (observation.distanceFromPinM > 0.0) details.add(formatDistance(observation.distanceFromPinM) + " from pin")
        observation.cloudCoverPct?.let { details.add("cloud %.0f %%".format(it)) }
        observation.frameIndex?.let { details.add("frame $it") }
        if (observation.note.isNotBlank()) details.add(observation.note)
        Text(text = details.joinToString("  ·  "), color = SrColors.Mist, fontSize = 11.sp)
        observation.zarrUri?.let {
            Text(text = it, color = SrColors.Lavender.copy(alpha = 0.8f), fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Spacer(modifier = Modifier.height(6.dp))
        DetectionStatusRow(observation, busy, onTrigger)
    }
}

@Composable
private fun DetectionStatusRow(observation: Observation, busy: Boolean, onTrigger: (String) -> Unit) {
    when (observation.detectionStatus) {
        DetectionStatus.NOT_RUN -> Text(
            text = "Run small-object detector",
            color = SrColors.Ink,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier
                .clip(RoundedCornerShape(6.dp))
                .background(if (busy) SrColors.Mist.copy(alpha = 0.5f) else SrColors.Lavender)
                .clickable(enabled = !busy) { onTrigger(observation.id) }
                .padding(horizontal = 10.dp, vertical = 6.dp),
        )
        DetectionStatus.QUEUED -> StatusPill("Queued on server", SrColors.Amber)
        DetectionStatus.RUNNING -> StatusPill("Detector running", SrColors.Sky)
        DetectionStatus.DONE -> StatusPill(
            if (observation.candidateCount == 0) "Done, no candidates" else "Done, ${observation.candidateCount} candidate sighting${if (observation.candidateCount == 1) "" else "s"}",
            if (observation.candidateCount == 0) SrColors.Mist else SrColors.Signal,
        )
    }
}

@Composable
private fun StatusPill(text: String, colour: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(colour))
        Spacer(modifier = Modifier.width(6.dp))
        Text(text = text, color = colour, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
private fun ActionButton(text: String, enabled: Boolean, onClick: () -> Unit) {
    Text(
        text = text,
        color = Color.White,
        fontSize = 14.sp,
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(if (enabled) SrColors.Charcoal else SrColors.Charcoal.copy(alpha = 0.5f))
            .border(1.dp, SrColors.Mist, RoundedCornerShape(10.dp))
            .clickable(enabled = enabled, onClick = onClick)
            .padding(horizontal = 18.dp, vertical = 12.dp),
    )
}

private fun sourceColour(kind: DataSourceKind): Color = when (kind) {
    DataSourceKind.SATELLITE -> SrColors.Satellite
    DataSourceKind.DASHCAM -> SrColors.Dashcam
    DataSourceKind.UAV -> SrColors.Uav
}

private fun sourceTitle(kind: DataSourceKind): String = when (kind) {
    DataSourceKind.SATELLITE -> "Satellite scenes"
    DataSourceKind.DASHCAM -> "Dashcam passes"
    DataSourceKind.UAV -> "UAV flights"
}

private fun equipmentLabel(kind: EquipmentKind): String = when (kind) {
    EquipmentKind.UAV_VISUAL -> "UAV, visual camera"
    EquipmentKind.UAV_THERMAL -> "UAV, thermal camera"
    EquipmentKind.GROUND_TEAM -> "Ground search teams"
    EquipmentKind.VEHICLE_PATROL -> "Vehicle patrol"
    EquipmentKind.DOG_TEAM -> "Search dog team"
    EquipmentKind.HELICOPTER -> "Helicopter tasking"
}

private fun confidenceColour(name: String): Color = when (name) {
    "HIGH" -> SrColors.Signal
    "MEDIUM" -> SrColors.Amber
    else -> SrColors.Danger
}

private fun formatDistance(metres: Double): String =
    if (metres >= 1_000.0) "%.1f km".format(metres / 1000.0) else "%.0f m".format(metres)

private const val MAX_FOOTPRINTS_PER_SOURCE = 12
private const val MAX_LISTED_OBSERVATIONS = 8
