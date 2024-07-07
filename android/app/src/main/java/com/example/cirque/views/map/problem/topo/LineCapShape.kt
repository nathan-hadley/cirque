package com.example.cirque.views.map.problem.topo

import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.PaintingStyle
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.unit.dp

fun DrawScope.drawLineCapShape(
    points: List<List<Int>>,
    originalImageSize: Size,
    displayedImageSize: Size,
    color: Color
) {
    if (points.isEmpty()) return

    val scaleX = displayedImageSize.width / originalImageSize.width
    val scaleY = displayedImageSize.height / originalImageSize.height

    val firstPoint = points.first()
    val startPoint = Offset(firstPoint[0] * scaleX, firstPoint[1] * scaleY)
    val capRadius = 5.dp.toPx()

    drawIntoCanvas { canvas ->
        canvas.drawCircle(
            radius = capRadius,
            center = startPoint,
            paint = Paint().apply {
                this.color = color
                this.style = PaintingStyle.Fill
            }
        )
    }
}
