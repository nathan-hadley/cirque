package com.example.cirque.views

import Problem
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.Image
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.toSize
import coil.compose.rememberAsyncImagePainter
import com.example.cirque.R
import com.example.cirque.views.map.problem.topo.LineView

@Composable
fun TopoView(problem: Problem) {
    var imageSize by remember { mutableStateOf(Size.Zero) }

    if (problem.topo != null) {
        val imageName = "${problem.topo}.jpeg"

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Transparent)
        ) {
            Image(
                painter = painterResource(id = R.drawable.forestland_alcove),
                contentDescription = null
                // TODO: replace with topo image
                // Set imageSize
            )
//            LineView(
//                problem = problem,
//                originalImageSize = Size(
//                    imagePainter.intrinsicSize.width,
//                    imagePainter.intrinsicSize.height
//                ),
//                displayedImageSize = imageSize
//            )
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                painter = painterResource(id = android.R.drawable.ic_menu_report_image),
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = Color.Black
            )
            Text(
                text = "No Topo",
                style = MaterialTheme.typography.titleLarge.copy(color = Color.Black),
                modifier = Modifier.padding(top = 6.dp)
            )
        }
    }
}