package com.example.cirque.views.map

import MapViewModel
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalDensity
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.example.cirque.ui.theme.CirqueTheme
import com.example.cirque.views.map.MapEnv.INITIAL_CENTER
import com.example.cirque.views.map.MapEnv.INITIAL_ZOOM
import com.example.cirque.views.map.MapEnv.STYLE_URI_STRING
import com.example.cirque.views.map.problem.ProblemView
import com.mapbox.maps.MapboxExperimental
import com.mapbox.maps.MapboxMap
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

    var mapboxMap by remember { mutableStateOf<MapboxMap?>(null) }

    val configuration = LocalConfiguration.current
    val screenHeightDp = configuration.screenHeightDp.dp
    val sheetHeightDp = screenHeightDp * 0.45f // Half the screen height

    val bottomSheetState = rememberStandardBottomSheetState(
        initialValue = if (problem != null) SheetValue.Expanded else SheetValue.Hidden,
        skipHiddenState = false
    )

    val bottomSheetScaffoldState = rememberBottomSheetScaffoldState(
        bottomSheetState = bottomSheetState
    )

    LaunchedEffect(bottomSheetState.currentValue) {
        if (bottomSheetState.currentValue == SheetValue.PartiallyExpanded && problem != null) {
            // When the sheet is hidden, set problem to null
            mapViewModel.setProblem(null)
        }
    }

    LaunchedEffect(problem) {
        if (problem != null) {
            bottomSheetState.expand()
        } else {
            bottomSheetState.hide()
        }
    }

    CirqueTheme {
        BottomSheetScaffold(
            scaffoldState = bottomSheetScaffoldState,
            sheetContent = {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(sheetHeightDp)
                        .background(MaterialTheme.colorScheme.surface)
                ) {
                    if (problem != null) {
                        ProblemView(problem = mapViewModel.problem)
                    }
                }
            },
            sheetPeekHeight = 0.dp, // Start hidden
            sheetContainerColor = Color.Transparent,
            sheetSwipeEnabled = true,
            sheetDragHandle = null, // Remove the drag bar
            content = {
                Box(modifier = Modifier.fillMaxSize()) {
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
                            mapboxMap = mapView.mapboxMap

                            mapboxMap?.addOnMapClickListener { point ->
                                mapViewModel.mapTapped(point, mapboxMap!!, bottomInset = 0.0)
                                true
                            }
                            mapboxMap?.subscribeCameraChanged {
                                mapViewModel.setViewport(mapboxMap!!.cameraState)
                            }
                        }
                    }

                    // Navigation Buttons
                    if (problem != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = sheetHeightDp + 10.dp)
                                .align(Alignment.BottomCenter)
                                .zIndex(1f), // Ensure buttons are on top
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            // Previous problem button
                            IconButton(
                                onClick = {
                                    mapboxMap?.let { mapViewModel.showPreviousProblem(it) }
                                },
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
                                onClick = {
                                    mapboxMap?.let { mapViewModel.showNextProblem(it) }
                                },
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
                    }
                }
            }
        )
    }
}


