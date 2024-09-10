package com.example.cirque.views.map

import MapViewModel
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
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
    val mapViewModel: MapViewModel = viewModel()
    val problem by mapViewModel.problem.observeAsState()
    val cameraState by mapViewModel.cameraState.observeAsState()

    // Get the screen height in dp
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    val circuitNavButtonHeight = screenHeight * 0.45f

    CirqueTheme {
        MapboxMap(
            Modifier.fillMaxSize(),
            mapViewportState = remember { MapViewportState() }.apply {
                cameraState?.let {
                    setCameraOptions {
                        center(it.center)
                        zoom(it.zoom)
                        pitch(it.pitch)
                        bearing(it.bearing)
                    }
                } ?: run {
                    setCameraOptions {
                        zoom(INITIAL_ZOOM)
                        center(INITIAL_CENTER)
                        pitch(0.0)
                        bearing(0.0)
                    }
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
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = circuitNavButtonHeight),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Previous problem button
                IconButton(
                    onClick = { /* TODO: Previous problem action */ },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Previous problem",
                        tint = Color.Black
                    )
                }

                // Next problem button
                IconButton(
                    onClick = { /* TODO: Next problem action */ },
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Next problem",
                        tint = Color.Black
                    )
                }
            }

            ModalBottomSheet(
                onDismissRequest = {
                    mapViewModel.setProblem(null)
                },
                dragHandle = null,
            ) {
                ProblemView(problem = mapViewModel.problem)
            }
        }
    }
}