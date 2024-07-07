package com.example.cirque.views

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.ClickableText
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.cirque.ui.theme.CirqueTheme

@Composable
fun AboutView(navController: NavController) {
    val circuits = listOf(
        "Forestland Blue Circuit (V0-2)",
        "Swiftwater Red Circuit (V0-3)",
        "Forestland Black Circuit (V2-5)",
        "Straightaways White Circuit (V4-9)"
    )

    val githubText = buildAnnotatedString {
        val text = "The code for this project can be found on GitHub."
        val startIndex = text.indexOf("GitHub")
        val endIndex = startIndex + 6

        append(text)
        addStyle(style = SpanStyle(color = Color.Blue), startIndex, endIndex)
        addStringAnnotation(
            tag = "URL",
            annotation = "https://github.com/nathan-hadley/cirque-ios",
            start = startIndex,
            end = endIndex
        )
    }
    val uriHandler = LocalUriHandler.current

    val bodyStyle = MaterialTheme.typography.bodyLarge
    val bodyModifier = Modifier.padding(vertical = 12.dp)

    CirqueTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(15.dp),
                horizontalAlignment = Alignment.Start,
                verticalArrangement = Arrangement.Top
            ) {
                Text(
                    "About",
                    style = MaterialTheme.typography.displayMedium,
                    modifier = bodyModifier
                )
                Text(
                    "After a trip to Fontainebleau, France, we were inspired to bring their concept of bouldering circuits to Leavenworth. These circuits have been developed so far:",
                    style = bodyStyle,
                    modifier = bodyModifier
                )
                circuits.forEach { circuit ->
                    BulletText(text = circuit)
                }
                Text(
                    "If you're a developer, please reach out about contributing. If you're not a developer but want to help, please also reach out me at @nathanhadley_ on Instagram or Threads. Collecting all the information to add a new circuit takes time and I could use help!",
                    style = bodyStyle,
                    modifier = bodyModifier
                )
                ClickableText(
                    text = githubText,
                    style = bodyStyle,
                    modifier = bodyModifier,
                    onClick = { githubText
                        .getStringAnnotations("URL", it, it)
                        .firstOrNull()?.let { text ->
                            uriHandler.openUri(text.item)
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun BulletText(text: String) {
    Row(
        verticalAlignment = Alignment.Top,
        modifier = Modifier.padding(vertical = 4.dp)
    ) {
        Text(
            "•",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onBackground
        )
    }
}