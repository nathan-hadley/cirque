package com.example.cirque.tabs

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Place
import androidx.compose.ui.graphics.vector.ImageVector
import com.example.cirque.views.Views

data class Tab(
    val label : String = "",
    val icon : ImageVector = Icons.Filled.Place,
    val route : String = ""
) {

    //function to get the list of bottomNavigationItems
    fun bottomNavigationItems() : List<Tab> {
        return listOf(
            Tab(
                label = "Map",
                icon = Icons.Filled.Place,
                route = Views.Map.route
            ),
            Tab(
                label = "About",
                icon = Icons.Filled.Info,
                route = Views.About.route
            ),
        )
    }
}