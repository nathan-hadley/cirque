package com.example.cirque.views

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavController
import com.example.cirque.ui.theme.CirqueTheme
import com.mapbox.geojson.Point
import com.mapbox.maps.MapboxExperimental
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.MapViewportState
import com.mapbox.maps.extension.compose.style.MapStyle

@Composable
@OptIn(MapboxExperimental::class)
fun MapView(navController: NavController) {
    CirqueTheme {
        MapboxMap(
            Modifier.fillMaxSize(),
            mapViewportState = MapViewportState().apply {
                setCameraOptions {
                    zoom(10.5)
                    center(Point.fromLngLat(-120.713, 47.585))
                    pitch(0.0)
                    bearing(0.0)
                }
            },
            style = {
                MapStyle(style = "mapbox://styles/nathanhadley/clw9fowlu01kw01obbpsp3wiq")
            }
        )
    }
}