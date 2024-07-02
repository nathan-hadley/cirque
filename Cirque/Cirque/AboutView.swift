//
//  AboutView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/13/24.
//

import SwiftUI

struct BulletText: View {
    let text: String
    
    var body: some View {
        HStack(alignment: .top) {
            Text("•")
                .font(.body)
                .foregroundColor(.primary)
            Text(text)
                .font(.body)
                .foregroundColor(.primary)
        }
        .padding(.vertical, 2)
    }
}

struct AboutView: View {
    @StateObject private var offlineMaps = OfflineMaps()
    
    let gitHubText = "The code for this project can be found at [GitHub](https://github.com/nathan-hadley/cirque-ios)."
    let circuits = [
        "Forestland Blue Circuit (V0-2)",
        "Swiftwater Red Circuit (V0-3)",
        "Forestland Black Circuit (V2-5)",
        "Straightaways White Circuit (V4-9)"
    ]
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("About")
                        .font(.largeTitle)
                        .padding(.top, 20)
                    
                    Text("After a trip to Fontainebleau, France, we were inspired to bring their concept of bouldering circuits to Leavenworth. These circuits have been developed so far:")
                    
                    ForEach(circuits, id: \.self) { circuit in
                        BulletText(text: circuit)
                    }
                    
                    Text("If you're a developer, please reach out about contributing. If you're not a developer but want to help, please also reach out me at @nathanhadley_ on Instagram or Threads. Collecting all the information to add a new circuit takes time and I could use help!")
                    
                    Text(.init(gitHubText))
                    
                    Text("Download Maps")
                        .font(.title)
                        .padding(.top, 20)
                    
                    Text("The app caches map data after viewing for an undetermined amount of time. To ensure circuits show up without network connection, download for offline use. If one of the circuits listed above is missing, try updating the map.")
                        .padding(.bottom, 20)
                    
                    if !offlineMaps.successMessage.isEmpty {
                        Text(offlineMaps.successMessage)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(Color.white)
                            .cornerRadius(4)
                    }
                    
                    if !offlineMaps.errorMessage.isEmpty {
                        Text(offlineMaps.errorMessage)
                            .padding()
                            .background(Color.red)
                            .foregroundColor(Color.white)
                            .cornerRadius(4)
                    }
                    
                    if offlineMaps.loading {
                        VStack {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                                .scaleEffect(2)
                                .padding()
                        }
                    } else {
                        Button(action: offlineMaps.updateMapData) {
                            Text(offlineMaps.mapDownloaded ? "Update Map" : "Download Map")
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(Color.white)
                                .cornerRadius(8)
                        }
                    }
                }
                .padding(.horizontal)
                .padding(.bottom)
            }
        }
        .navigationBarTitle("About", displayMode: .inline)
    }
}

struct AboutView_Previews: PreviewProvider {
    static var previews: some View {
        AboutView()
    }
}
