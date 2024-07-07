package com.example.cirque.views.map.problem.topo

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

fun DrawScope.drawLineShape(
    points: List<List<Int>>,
    originalImageSize: Size,
    displayedImageSize: Size,
    color: Color
) {
    val path = Path()

    if (points.isEmpty()) return

    val scaleX = displayedImageSize.width / originalImageSize.width
    val scaleY = displayedImageSize.height / originalImageSize.height

    val firstPoint = points.first()
    var startPoint = Offset(firstPoint[0] * scaleX, firstPoint[1] * scaleY)
    path.moveTo(startPoint.x, startPoint.y)

    for (i in 1 until points.size) {
        val nextPoint = Offset(points[i][0] * scaleX, points[i][1] * scaleY)
        val midPoint = Offset(
            (startPoint.x + nextPoint.x) / 2,
            (startPoint.y + nextPoint.y) / 2
        )
        path.quadraticBezierTo(startPoint.x, startPoint.y, midPoint.x, midPoint.y)
        startPoint = nextPoint
    }
    path.lineTo(startPoint.x, startPoint.y)

    drawPath(
        path = path,
        color = color,
        style = Stroke(width = 3.dp.toPx())
    )
}

