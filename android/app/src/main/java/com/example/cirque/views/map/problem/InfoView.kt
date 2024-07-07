package com.example.cirque.views

import Problem
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

@Composable
fun InfoView(problem: Problem) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = problem.name ?: "Unknown",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = MaterialTheme.typography.titleLarge.fontWeight
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f, fill = false)
            )

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = problem.grade ?: "",
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = MaterialTheme.typography.titleLarge.fontWeight
                )
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = problem.description ?: "",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
