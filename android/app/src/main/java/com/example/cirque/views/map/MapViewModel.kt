import android.util.Log
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.cirque.views.map.MapEnv.INITIAL_CENTER
import com.example.cirque.views.map.MapEnv.INITIAL_ZOOM
import com.example.cirque.views.map.MapEnv.PROBLEMS_LAYER
import com.mapbox.bindgen.Expected
import com.mapbox.bindgen.Value
import com.mapbox.common.Cancelable
import com.mapbox.geojson.Point
import com.mapbox.maps.CameraState
import com.mapbox.maps.EdgeInsets
import com.mapbox.maps.MapboxMap
import com.mapbox.maps.RenderedQueryGeometry
import com.mapbox.maps.RenderedQueryOptions
import com.mapbox.maps.ScreenBox
import com.mapbox.maps.ScreenCoordinate
import com.mapbox.maps.SourceQueryOptions

class MapViewModel : ViewModel() {

    private val _problem = MutableLiveData<Problem?>(null)
    val problem: LiveData<Problem?> get() = _problem
    fun setProblem(problem: Problem?) {
        _problem.value = problem
    }

    private val _viewProblem = MutableLiveData(false)
    val viewProblem: LiveData<Boolean> get() = _viewProblem

    private val _viewport = MutableLiveData(CameraState(
        INITIAL_CENTER,
        EdgeInsets(0.0, 0.0, 0.0, 0.0),
        INITIAL_ZOOM,
        0.0,
        0.0
    ))
    val viewport: LiveData<CameraState> get() = _viewport
    fun setViewport(viewport: CameraState) {
        _viewport.value = viewport
    }

    private var bottomInset: Double = 0.0

    private var cancellable: Cancelable? = null

    fun mapTapped(point: Point, map: MapboxMap?, bottomInset: Double) {
        cancellable?.cancel()
        this.bottomInset = bottomInset
        map?.let {
            val querySize = 44.0
            val screenCoordinate = map.pixelForCoordinate(point)
            val x = screenCoordinate.x - querySize / 2
            val y = screenCoordinate.y - querySize / 2
            val queryArea = RenderedQueryGeometry(
                ScreenBox(
                    ScreenCoordinate(x, y),
                    ScreenCoordinate(x + querySize, y + querySize)
                )
            )
            val options = RenderedQueryOptions(listOf(PROBLEMS_LAYER), null)
            cancellable = map.queryRenderedFeatures(queryArea, options) { result ->
                cancellable = null
                val firstFeature = result.value?.firstOrNull()
                firstFeature?.let {
                    val newProblem = Problem.fromFeature(it.queriedFeature.feature)
                    setNewProblem(newProblem)
                    Log.d("MapViewModel", "New problem: $newProblem")
                }
            }
        }
    }

    fun showPreviousProblem(map: MapboxMap?) {
        problem.value?.let {
            fetchAdjacentProblem(map, it, -1)
        }
    }

    fun showNextProblem(map: MapboxMap?) {
        problem.value?.let {
            fetchAdjacentProblem(map, it, 1)
        }
    }

    private fun fetchAdjacentProblem(map: MapboxMap?, currentProblem: Problem, offset: Int) {
        map?.let {
            currentProblem.order?.let { currentOrder ->
                val newProblemOrder = currentOrder + offset
                val filterJson = """
                    [
                        "all",
                        ["==", ["get", "color"], "${currentProblem.colorStr}"],
                        ["==", ["get", "subarea"], "${currentProblem.subarea ?: ""}"],
                        [
                            "any",
                            ["==", ["get", "order"], "$newProblemOrder"],
                            ["==", ["get", "order"], $newProblemOrder]
                        ]
                    ]
                """.trimIndent()

                val filterExpected: Expected<String, Value> = Value.fromJson(filterJson)
                if (filterExpected.isError || filterExpected.value == null) {
                    return
                }

                val filterValue: Value = filterExpected.value!!
                val options = SourceQueryOptions(listOf(PROBLEMS_LAYER), filterValue)
                map.querySourceFeatures("composite", options) { result ->
                    result.value?.firstOrNull()?.let {
                        val newProblem = Problem.fromFeature(it.queriedFeature.feature)
                        setNewProblem(newProblem)
                    }
                }
            }
        }
    }

    private fun setNewProblem(problem: Problem) {
        _problem.value = problem
        _viewProblem.value = true
        _viewport.value = CameraState(
            problem.coordinates ?: INITIAL_CENTER,
            EdgeInsets(0.0, 0.0, bottomInset, 0.0),
            _viewport.value?.zoom ?: INITIAL_ZOOM,
            _viewport.value?.bearing ?: 0.0,
            _viewport.value?.pitch ?: 0.0
        )
    }
}
