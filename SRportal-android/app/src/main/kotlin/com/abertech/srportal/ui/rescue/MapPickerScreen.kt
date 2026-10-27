package com.abertech.srportal.ui.rescue

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.abertech.srportal.core.GeoPosition
import com.abertech.srportal.core.Place
import com.abertech.srportal.di.LocalAppContainer
import com.abertech.srportal.ui.components.PrimaryButton
import com.abertech.srportal.ui.components.SrScaffold
import com.abertech.srportal.ui.map.MapOverlays
import com.abertech.srportal.ui.map.OsmMap
import com.abertech.srportal.ui.theme.SrColors
import kotlinx.coroutines.launch
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView

/**
 * Full-screen map with the "Search Map" bar and zoom pill; tapping drops the pin.
 */
@Composable
fun MapPickerScreen(viewModel: NewRescueViewModel, onConfirm: () -> Unit) {
    val container = LocalAppContainer.current
    val wizard by viewModel.wizard.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val keyboard = LocalSoftwareKeyboardController.current
    var query by remember { mutableStateOf("") }
    var results by remember { mutableStateOf<List<Place>>(emptyList()) }
    val mapHolder = remember { arrayOfNulls<MapView>(1) }
    val renderedPin = remember { arrayOf<GeoPosition?>(null) }
    val pin = wizard.pin

    fun runSearch() {
        keyboard?.hide()
        scope.launch { results = container.repository.geocode(query) }
    }

    fun choose(place: Place) {
        results = emptyList()
        query = place.name
        viewModel.setPin(place.position, place.name)
        mapHolder[0]?.controller?.animateTo(GeoPoint(place.position.lat, place.position.lon))
    }

    SrScaffold { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            OsmMap(
                modifier = Modifier.fillMaxSize(),
                initialCentre = pin ?: viewModel.defaultPin,
                initialZoom = if (pin != null) 12.0 else 9.0,
                onTap = { position -> viewModel.setPin(position) },
                update = { map ->
                    mapHolder[0] = map
                    if (renderedPin[0] != pin) {
                        MapOverlays.clear(map)
                        if (pin != null) MapOverlays.addPin(map, pin)
                        map.invalidate()
                        renderedPin[0] = pin
                    }
                },
            )
            Column(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
                SearchBar(
                    query = query,
                    onQueryChange = { query = it },
                    onSearch = { runSearch() },
                )
                if (results.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(SrColors.CharcoalDark),
                    ) {
                        for (place in results) {
                            Text(
                                text = place.name + if (place.region.isNotBlank()) "  ·  ${place.region}" else "",
                                color = Color.White,
                                fontSize = 14.sp,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { choose(place) }
                                    .padding(horizontal = 14.dp, vertical = 12.dp),
                            )
                        }
                    }
                }
            }
            ZoomPill(
                modifier = Modifier.align(Alignment.CenterEnd).padding(end = 10.dp),
                onZoomIn = { mapHolder[0]?.controller?.zoomIn() },
                onZoomOut = { mapHolder[0]?.controller?.zoomOut() },
            )
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(16.dp),
            ) {
                Text(
                    text = if (pin != null) "Pin: %.5f, %.5f".format(pin.lat, pin.lon) else "Tap the map to drop the last known location",
                    color = Color.White,
                    fontSize = 13.sp,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(SrColors.CharcoalDark.copy(alpha = 0.9f))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                )
                Spacer(modifier = Modifier.height(10.dp))
                PrimaryButton(text = "confirm", onClick = onConfirm, enabled = pin != null)
            }
        }
    }
}

@Composable
private fun SearchBar(query: String, onQueryChange: (String) -> Unit, onSearch: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(SrColors.Lavender)
            .padding(horizontal = 14.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(imageVector = Icons.Filled.Menu, contentDescription = null, tint = SrColors.Ink)
        Spacer(modifier = Modifier.width(14.dp))
        Box(modifier = Modifier.weight(1f)) {
            if (query.isEmpty()) {
                Text(text = "Search Map", color = SrColors.Ink.copy(alpha = 0.7f), fontSize = 16.sp)
            }
            BasicTextField(
                value = query,
                onValueChange = onQueryChange,
                singleLine = true,
                textStyle = TextStyle(color = SrColors.Ink, fontSize = 16.sp),
                cursorBrush = SolidColor(SrColors.Ink),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { onSearch() }),
                modifier = Modifier.fillMaxWidth(),
            )
        }
        Spacer(modifier = Modifier.width(14.dp))
        Icon(
            imageVector = Icons.Filled.Search,
            contentDescription = "Search",
            tint = SrColors.Ink,
            modifier = Modifier.clickable { onSearch() },
        )
    }
}

@Composable
private fun ZoomPill(modifier: Modifier = Modifier, onZoomIn: () -> Unit, onZoomOut: () -> Unit) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(SrColors.Lavender)
            .padding(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        ZoomButton(icon = Icons.Filled.Add, description = "Zoom in", onClick = onZoomIn)
        Spacer(modifier = Modifier.height(10.dp))
        ZoomButton(icon = Icons.Filled.Remove, description = "Zoom out", onClick = onZoomOut)
    }
}

@Composable
private fun ZoomButton(icon: ImageVector, description: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(46.dp)
            .clip(CircleShape)
            .background(SrColors.Charcoal)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Icon(imageVector = icon, contentDescription = description, tint = SrColors.Mist, modifier = Modifier.size(28.dp))
    }
}
