package com.example.cirque.ui.dashboard

import android.os.Bundle
import android.text.method.LinkMovementMethod
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import com.example.cirque.databinding.FragmentAboutBinding

class AboutFragment : Fragment() {

  private var _binding: FragmentAboutBinding? = null
  private val binding get() = _binding!!

  override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
  ): View {
    val aboutViewModel =
      ViewModelProvider(this).get(AboutViewModel::class.java)

    _binding = FragmentAboutBinding.inflate(inflater, container, false)
    val root: View = binding.root

    aboutViewModel.text.observe(viewLifecycleOwner) {
      binding.textAbout.text = it
    }

    aboutViewModel.circuits.observe(viewLifecycleOwner) { circuits ->
      binding.circuitsText.text = circuits.joinToString("\n• ", prefix = "• ")
    }

    aboutViewModel.githubText.observe(viewLifecycleOwner) { githubText ->
      binding.githubText.text = githubText
      binding.githubText.movementMethod = LinkMovementMethod.getInstance()
    }

    return root
  }

  override fun onDestroyView() {
    super.onDestroyView()
    _binding = null
  }
}
