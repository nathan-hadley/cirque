//
//  AboutView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/13/24.
//

import SwiftUI

struct AboutView: View {
    let gitHubText = "The code for this project can be found at [GitHub](https://github.com/nathan-hadley/cirque-ios)."
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("About")
                .font(.largeTitle)
                .padding()
            
            Text("After a trip to Fontainebleau, France, I was inspired to bring their concept of bouldering circuits to Leavenworth. This app will allow the creation and sharing of circuits. We are starting with one V0-V3 Swiftwater circuit and a V4-V9 Straightaways circuit but more will be added soon. Forestland is next!")
                .padding()
                
            Text("If you're a developer, please reach out about contributing. If you're not a developer but want to help, please also reach out. Collecting all the information to add a new circuit takes time!")
                .padding()
            
            Text(.init(gitHubText))
                .padding()
        }
    }
}
