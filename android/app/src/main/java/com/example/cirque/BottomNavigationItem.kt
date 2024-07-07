package com.example.cirque

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Place
import androidx.compose.ui.graphics.vector.ImageVector

data class BottomNavigationItem(
    val label : String = "",
    val icon : ImageVector = Icons.Filled.Place,
    val route : String = ""
) {

    //function to get the list of bottomNavigationItems
    fun bottomNavigationItems() : List<BottomNavigationItem> {
        return listOf(
            BottomNavigationItem(
                label = "Map",
                icon = Icons.Filled.Place,
                route = Views.Map.route
            ),
            BottomNavigationItem(
                label = "About",
                icon = Icons.Filled.Info,
                route = Views.About.route
            ),
        )
    }
}