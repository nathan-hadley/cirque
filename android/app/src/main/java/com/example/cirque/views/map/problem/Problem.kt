import androidx.compose.ui.graphics.Color
import com.example.cirque.views.map.getInt
import com.example.cirque.views.map.getString
import com.google.gson.JsonObject
import com.mapbox.geojson.Feature
import com.mapbox.geojson.Point
import org.json.JSONArray
import java.util.UUID

data class Problem(
    val id: UUID = UUID.randomUUID(),
    val name: String?,
    val grade: String?,
    val order: Int?,
    val colorStr: String,
    val color: Color,
    val description: String?,
    val line: List<List<Int>>,
    val topo: String?,
    val subarea: String?,
    val coordinates: Point?
) {
    companion object {
        fun fromFeature(feature: Feature): Problem {
            val properties = feature.properties() ?: JsonObject()

            val name = getString(properties, "name")
            val grade = getString(properties, "grade")
            val order = getInt(properties, "order")
            val description = getString(properties, "description")
            val topo = getString(properties, "topo")
            val subarea = getString(properties, "subarea")

            val colorStr = getString(properties, "color") ?: ""
            val color = colorFromString(colorStr)

            val lineString = getString(properties, "line")
            val line = parseTopoLine(lineString)

            val coordinates = (feature.geometry() as? Point)

            return Problem(
                name = name,
                grade = grade,
                order = order,
                colorStr = colorStr,
                color = color,
                description = description,
                line = line,
                topo = topo,
                subarea = subarea,
                coordinates = coordinates
            )
        }

        private fun parseTopoLine(stringCoords: String?): List<List<Int>> {
            if (stringCoords.isNullOrEmpty()) return emptyList()
            return try {
                val jsonArray = JSONArray(stringCoords)
                (0 until jsonArray.length()).map { i ->
                    val innerArray = jsonArray.getJSONArray(i)
                    (0 until innerArray.length()).map { j -> innerArray.getInt(j) }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                emptyList()
            }
        }

        private fun colorFromString(colorString: String?): Color {
            return when (colorString) {
                "blue" -> Color.Blue
                "white" -> Color.White
                "red" -> Color.Red
                "orange" -> Color(0xFFFFA500)
                "yellow" -> Color.Yellow
                "black" -> Color.Black
                else -> Color.Black
            }
        }
    }
}
