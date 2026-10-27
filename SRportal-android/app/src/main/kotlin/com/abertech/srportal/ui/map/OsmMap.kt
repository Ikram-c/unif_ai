package com.abertech.srportal.ui.map

import android.graphics.Paint
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.abertech.srportal.R
import com.abertech.srportal.core.GeoPosition
import org.osmdroid.events.MapEventsReceiver
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.CustomZoomButtonsController
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.MapEventsOverlay
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.Overlay
import org.osmdroid.views.overlay.Polygon

/**
 * osmdroid map hosted in Compose. Overlays are managed by callers through [update].
 *
 * The view is created once per composition and follows the lifecycle so tile loading pauses
 * with the activity. [onTap] receives single taps as positions, which the wizard uses to drop
 * the pin.
 */
@Composable
fun OsmMap(
    modifier: Modifier = Modifier,
    initialCentre: GeoPosition,
    initialZoom: Double = 11.0,
    onTap: ((GeoPosition) -> Unit)? = null,
    update: (MapView) -> Unit = {},
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val tapHandler = rememberUpdatedState(onTap)
    val mapView = remember {
        MapView(context).apply {
            setTileSource(TileSourceFactory.MAPNIK)
            setMultiTouchControls(true)
            setTilesScaledToDpi(true)
            zoomController.setVisibility(CustomZoomButtonsController.Visibility.NEVER)
            setMinZoomLevel(4.0)
            setMaxZoomLevel(19.0)
            controller.setZoom(initialZoom)
            controller.setCenter(GeoPoint(initialCentre.lat, initialCentre.lon))
            overlays.add(
                MapEventsOverlay(object : MapEventsReceiver {
                    override fun singleTapConfirmedHelper(p: GeoPoint): Boolean {
                        val handler = tapHandler.value ?: return false
                        handler(GeoPosition(p.latitude, p.longitude))
                        return true
                    }

                    override fun longPressHelper(p: GeoPoint): Boolean = false
                })
            )
        }
    }
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> mapView.onResume()
                Lifecycle.Event.ON_PAUSE -> mapView.onPause()
                else -> Unit
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            mapView.onDetach()
        }
    }
    AndroidView(modifier = modifier, factory = { mapView }, update = { update(it) })
}

/**
 * Overlay helpers shared by the picker and the results map.
 */
object MapOverlays {
    /**
     * Removes every overlay except the tap receiver.
     */
    fun clear(map: MapView) {
        val keep = ArrayList<Overlay>(1)
        for (overlay in map.overlays) {
            if (overlay is MapEventsOverlay) keep.add(overlay)
        }
        map.overlays.clear()
        map.overlays.addAll(keep)
    }

    /**
     * Drops the last-known-location pin.
     */
    fun addPin(map: MapView, position: GeoPosition, title: String = "Last known location") {
        val marker = Marker(map)
        marker.setPosition(GeoPoint(position.lat, position.lon))
        marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
        marker.setTitle(title)
        ContextCompat.getDrawable(map.context, R.drawable.ic_pin)?.let { marker.setIcon(it) }
        map.overlays.add(marker)
    }

    /**
     * A translucent disc, used for the probability rings.
     */
    fun addCircle(map: MapView, centre: GeoPosition, radiusM: Double, strokeColour: Int, fillColour: Int, strokeWidthPx: Float) {
        val polygon = Polygon(map)
        polygon.setPoints(Polygon.pointsAsCircle(GeoPoint(centre.lat, centre.lon), radiusM))
        polygon.fillPaint.color = fillColour
        polygon.fillPaint.style = Paint.Style.FILL
        polygon.outlinePaint.color = strokeColour
        polygon.outlinePaint.strokeWidth = strokeWidthPx
        polygon.outlinePaint.style = Paint.Style.STROKE
        map.overlays.add(polygon)
    }

    /**
     * Any ring of positions: hex cells and imagery footprints.
     */
    fun addPolygon(map: MapView, ring: List<GeoPosition>, strokeColour: Int, fillColour: Int, strokeWidthPx: Float, title: String? = null) {
        if (ring.size < 3) return
        val polygon = Polygon(map)
        polygon.setPoints(ring.map { GeoPoint(it.lat, it.lon) })
        polygon.fillPaint.color = fillColour
        polygon.fillPaint.style = Paint.Style.FILL
        polygon.outlinePaint.color = strokeColour
        polygon.outlinePaint.strokeWidth = strokeWidthPx
        polygon.outlinePaint.style = Paint.Style.STROKE
        if (title != null) polygon.setTitle(title)
        map.overlays.add(polygon)
    }

    /**
     * Zooms so that every position is visible, once the view has a size.
     */
    fun fit(map: MapView, positions: List<GeoPosition>, paddingPx: Int = 96) {
        if (positions.isEmpty()) return
        val box = BoundingBox.fromGeoPoints(positions.map { GeoPoint(it.lat, it.lon) })
        map.post { map.zoomToBoundingBox(box, false, paddingPx) }
    }
}
