//
//  MapView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/13/24.
//

import SwiftUI
@_spi(Experimental) import MapboxMaps

struct MapView: View {
    @StateObject private var mapViewModel = MapViewModel()
    @State private var map: MapboxMap?
    
    private var gestureOptions: GestureOptions {
        var options = GestureOptions()
        options.pitchEnabled = false
        options.rotateEnabled = false
        return options
    }
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                MapReader { proxy in
                    Map(viewport: $mapViewModel.viewport) {
                        Puck2D(bearing: .heading)
                            .showsAccuracyRing(true)
                    }
                        .mapStyle(MapStyle(uri: StyleURI(rawValue: "mapbox://styles/nathanhadley/clw9fowlu01kw01obbpsp3wiq")!))
                        .gestureOptions(gestureOptions)
                        .onMapTapGesture { context in
                            mapViewModel.mapTapped(context, map: proxy.map, bottomInset: geometry.size.height * 0.33)
                        }
                        .edgesIgnoringSafeArea(.top)
                        .overlay(alignment: .trailing) {
                            VStack {
                                Spacer() // Pushes the button to the bottom
                                LocateMeButton(viewport: $mapViewModel.viewport)
                                    .padding(.bottom, 10)
                                    .padding(.trailing, 70)
                            }
                        }
                        .sheet(isPresented: $mapViewModel.viewProblem, content: {
                            if let problem = $mapViewModel.problem.wrappedValue {
                                ProblemView(problem: Binding(
                                    get: { problem },
                                    set: { mapViewModel.problem = $0 }
                                ))
                                    .presentationDetents([.medium])
                                    .presentationBackgroundInteraction(.enabled(upThrough: .medium))
                            }
                        })
                        .onAppear {
                            self.map = proxy.map
                        }
                }
                .zIndex(1) // Ensure the map is behind other elements
                
                if let map = map, mapViewModel.viewProblem {
                    CircuitNavButtons(mapViewModel: mapViewModel, map: map)
                        .padding(.horizontal)
                        .padding(.bottom, 100)
                        .zIndex(2) // Ensure the navigation buttons are above the map and sheet
                }
            }
        }
    }
}
