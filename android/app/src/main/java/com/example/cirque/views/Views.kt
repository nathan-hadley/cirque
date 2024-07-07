package com.example.cirque.views

sealed class Views(val route : String) {
    object Map : Views("map_route")
    object About : Views("about_route")
}