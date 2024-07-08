package com.example.cirque.views.map

import MapViewModel
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.navigation.NavController
import com.example.cirque.ui.theme.CirqueTheme
import com.example.cirque.views.map.MapEnv.INITIAL_CENTER
import com.example.cirque.views.map.MapEnv.INITIAL_ZOOM
import com.example.cirque.views.map.MapEnv.STYLE_URI_STRING
import com.example.cirque.views.map.problem.ProblemView
import com.mapbox.maps.MapboxExperimental
import com.mapbox.maps.extension.compose.MapEffect
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.MapViewportState
import com.mapbox.maps.extension.compose.style.MapStyle
import com.mapbox.maps.plugin.gestures.addOnMapClickListener

@Composable
@OptIn(MapboxExperimental::class, ExperimentalMaterial3Api::class)
fun MapView(navController: NavController) {
    val mapViewModel = remember { MapViewModel() }
    val problem by mapViewModel.problem.observeAsState()

    CirqueTheme {
        MapboxMap(
            Modifier.fillMaxSize(),
            mapViewportState = MapViewportState().apply {
                setCameraOptions {
                    zoom(INITIAL_ZOOM)
                    center(INITIAL_CENTER)
                    pitch(0.0)
                    bearing(0.0)
                }
            },
            style = {
                MapStyle(style = STYLE_URI_STRING)
            },
        ) {
            MapEffect(Unit) { mapView ->
                val mapboxMap = mapView.mapboxMap
                mapboxMap.addOnMapClickListener { point ->
                    // TODO: pass bottom inset when sheet is implemented
                    mapViewModel.mapTapped(point, mapboxMap, bottomInset = 0.0)
                    true
                }
                mapboxMap.subscribeCameraChanged {
                    mapViewModel.setViewport(mapboxMap.cameraState)
                }
            }
        }

        if (problem != null) {
            ModalBottomSheet(
                onDismissRequest = {
                    mapViewModel.setProblem(null)
                },
            ) {
                ProblemView(problem = mapViewModel.problem)
            }
        }
    }
}