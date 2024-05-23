//
//  AboutView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/13/24.
//

import SwiftUI

struct AboutView: View {
    let gitHubText = "The code for this project can be found at on [GitHub](https://github.com/nathan-hadley/cirque-ios)."
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("About")
                .font(.largeTitle)
                .padding()
            
            Text("After a trip to Fontainebleau, France, I was inspired to bring their concept of bouldering circuits to Leavenworth. This app will allow the creation and sharing of circuits. We are starting with one V0-V3 Swiftwater circuit but more will be added soon.")
                .padding()
                
            Text("If you're a developer, please reach out about contributing. If you're not a developer but want to submit a circuit, please send me a list of the problems and photos of each boulder, one blank and one with route line(s). I will also need coordinates for each boulder (not each problem).")
                .padding()
            
            Text(.init(gitHubText))
                .padding()
        }
    }
}
