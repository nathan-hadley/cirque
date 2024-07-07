package com.example.cirque.views.map.problem.topo

import Problem
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size

@Composable
fun LineView(
    problem: Problem,
    originalImageSize: Size,
    displayedImageSize: Size
) {
    Box(modifier = Modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            drawLineShape(
                points = problem.line,
                originalImageSize = originalImageSize,
                displayedImageSize = displayedImageSize,
                color = problem.color
            )
            drawLineCapShape(
                points = problem.line,
                originalImageSize = originalImageSize,
                displayedImageSize = displayedImageSize,
                color = problem.color
            )
        }
    }
}
