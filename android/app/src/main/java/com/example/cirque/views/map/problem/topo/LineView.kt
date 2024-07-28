package com.example.cirque.views.map.problem.topo

import Problem
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.PathMeasure
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

@Composable
internal fun LineView(problem: Problem) {
    val line = problem.line
    // Normalize the coordinates to be between 0 and 1 for image size of 640x480
    val points = line.map { listOf(it[0] / 640f, it[1] / 480f) }
    val color = problem.color

    BoxWithConstraints(
        modifier = Modifier
    ) {
        val path by remember { mutableStateOf(Path()) }
        var pathLength by remember { mutableFloatStateOf(0f) }
        var internalColor by remember { mutableStateOf(Color.Transparent) }
        val lineLengthRatio = remember { Animatable(0f) }

        val width = constraints.maxWidth
        val height = constraints.maxHeight

        LaunchedEffect(key1 = points, key2 = color) {
            internalColor = Color.Transparent
            path.reset()

            path.addCubicCurves(
                points = points,
                containerWidth = width,
                containerHeight = height
            )

            pathLength = PathMeasure()
                .apply { setPath(path = path, forceClosed = false) }
                .length

            lineLengthRatio.snapTo(0f)
            internalColor = color
            lineLengthRatio.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 400, delayMillis = 300)
            )
        }

        Canvas(
            modifier = Modifier.fillMaxSize(),
            onDraw = {
                drawPath(
                    path = path,
                    color = internalColor,
                    style = Stroke(
                        width = (4.dp * 1f).toPx(),
                        cap = StrokeCap.Round,
                        join = StrokeJoin.Round,
                        pathEffect = PathEffect.dashPathEffect(
                            intervals = floatArrayOf(
                                pathLength * lineLengthRatio.value,
                                pathLength * 1f
                            ),
                            phase = 0f
                        )
                    )
                )
            }
        )
    }
}

private fun Path.addCubicCurves(
    points: List<List<Float>>,
    containerWidth: Int,
    containerHeight: Int
) {
    if (points.isEmpty()) return

    val startX = points[0][0] * containerWidth
    val startY = points[0][1] * containerHeight

    moveTo(startX, startY)

    when (points.size) {
        2 -> {
            lineToPoint(points[1], containerWidth, containerHeight)
        }
        3 -> {
            cubicToPoints(points[0], points[1], points[2], containerWidth, containerHeight)
        }
        else -> {
            for (i in 1 until points.size step 3) {
                if (i + 2 < points.size) {
                    cubicToPoints(points[i], points[i + 1], points[i + 2], containerWidth, containerHeight)
                }
            }
        }
    }
}

private fun Path.lineToPoint(
    point: List<Float>,
    containerWidth: Int,
    containerHeight: Int
) {
    val x = point[0] * containerWidth
    val y = point[1] * containerHeight
    lineTo(x, y)
}

private fun Path.cubicToPoints(
    point1: List<Float>,
    point2: List<Float>,
    point3: List<Float>,
    containerWidth: Int,
    containerHeight: Int
) {
    val x1 = point1[0] * containerWidth
    val y1 = point1[1] * containerHeight
    val x2 = point2[0] * containerWidth
    val y2 = point2[1] * containerHeight
    val x3 = point3[0] * containerWidth
    val y3 = point3[1] * containerHeight
    cubicTo(x1, y1, x2, y2, x3, y3)
}
