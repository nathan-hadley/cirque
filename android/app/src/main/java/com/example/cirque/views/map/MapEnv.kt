package com.example.cirque.views.map

import com.mapbox.geojson.Point
import com.mapbox.geojson.Polygon

object MapEnv {
    const val INITIAL_ZOOM = 10.5
    val INITIAL_CENTER: Point = Point.fromLngLat(-120.713, 47.585)
    const val STYLE_URI_STRING = "mapbox://styles/nathanhadley/clw9fowlu01kw01obbpsp3wiq"
    val BBOX_COORDS = listOf(
        listOf(
            Point.fromLngLat(-120.94, 47.51),
            Point.fromLngLat(-120.94, 47.75),
            Point.fromLngLat(-120.58, 47.75),
            Point.fromLngLat(-120.58, 47.51),
            Point.fromLngLat(-120.94, 47.51) // Closed box
        )
    )
    val BBOX_GEOMETRY: Polygon = Polygon.fromLngLats(BBOX_COORDS)
    const val TILEPACK_ID = "Leavenworth"
    const val PROBLEMS_LAYER = "Problems"
}
