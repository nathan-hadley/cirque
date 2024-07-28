package com.example.cirque.views.map.problem.topo

import Problem
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp

@Composable
fun TopoView(problem: Problem) {
    if (problem.topo != null) {
        val imageName = problem.topo.replace("-", "_")
        val context = LocalContext.current
        val imageResource = context.resources.getIdentifier(imageName, "drawable", context.packageName)

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 3f)
                .clip(shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp))
                .background(Color.Transparent),
            contentAlignment = Alignment.Center
        ) {
            Image(
                painter = painterResource(id = imageResource),
                contentDescription = null,
                modifier = Modifier.fillMaxSize()
            )
            LineView(problem = problem)
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