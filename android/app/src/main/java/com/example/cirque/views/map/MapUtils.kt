package com.example.cirque.views.map

import com.google.gson.JsonObject

fun getInt(properties: JsonObject?, key: String): Int? {
    val propertyValue = properties?.get(key) ?: return null
    return when {
        propertyValue.isJsonPrimitive -> {
            val primitive = propertyValue.asJsonPrimitive
            if (primitive.isNumber) {
                primitive.asInt
            } else {
                primitive.asString.toIntOrNull()
            }
        }
        else -> null
    }
}

fun getString(properties: JsonObject?, key: String): String? {
    val propertyValue = properties?.get(key) ?: return null
    return when {
        propertyValue.isJsonPrimitive -> propertyValue.asJsonPrimitive.asString
        else -> null
    }
}
