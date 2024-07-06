package com.example.cirque.ui.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

class AboutViewModel : ViewModel() {

  private val _text = MutableLiveData<String>().apply {
    value = "After a trip to Fontainebleau, France, we were inspired to bring their concept of bouldering circuits to Leavenworth. These circuits have been developed so far:"
  }
  val text: LiveData<String> = _text

  private val _circuits = MutableLiveData<List<String>>().apply {
    value = listOf(
      "Forestland Blue Circuit (V0-2)",
      "Swiftwater Red Circuit (V0-3)",
      "Forestland Black Circuit (V2-5)",
      "Straightaways White Circuit (V4-9)"
    )
  }
  val circuits: LiveData<List<String>> = _circuits

  private val _githubText = MutableLiveData<String>().apply {
    value = "The code for this project can be found at [GitHub](https://github.com/nathan-hadley/cirque-ios)."
  }
  val githubText: LiveData<String> = _githubText
}
