//
//  Model.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/18/24.
//

import SwiftUI
@_spi(Experimental) import MapboxMaps

@available(iOS 14.0, *)
class MapViewModel: ObservableObject {
    struct Location: Identifiable {
        var id = UUID()
        var coordinate: CLLocationCoordinate2D
    }
    @Published var problem: Problem? = nil
    @Published var viewport: Viewport = .camera(
        center: CLLocationCoordinate2D(latitude: 47.65441, longitude: -120.72967),
        zoom: 16,
        bearing: 0,
        pitch: 0
    )
    private var cancellable: Cancelable? = nil

    func mapTapped(_ context: MapContentGestureContext, map: MapboxMap?, bottomInset: CGFloat) {
        cancellable?.cancel()
        guard let map = map else { return }
        
        // Increase the size of the area to query (tappable area)
        let querySize: CGFloat = 44
        let queryArea = CGRect(
            x: context.point.x - querySize / 2,
            y: context.point.y - querySize / 2,
            width: querySize,
            height: querySize
        )
        
        cancellable = map.queryRenderedFeatures(with: queryArea) { [self] result in
            cancellable = nil
            guard let features = try? result.get() else { return }

            // Filter features based on the specific layer
            let filteredFeatures = features.filter { feature in
                if let sourceLayer = feature.queriedFeature.sourceLayer {
                    return sourceLayer == "swiftwater-problems-apl4s2"
                }
                return false
            }
            
            // Dismiss current sheet
            problem = nil
            
            guard let firstFeature = filteredFeatures.first else {
                return
            }

            // Delay setting the new feature to ensure the sheet is dismissed first
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                let newProblem = Problem(problem: firstFeature.queriedFeature.feature)
                self.problem = newProblem
            }
            
            withViewportAnimation(.easeOut(duration: 0.5)) {
                viewport = .camera(center: context.coordinate)
                    .padding(.bottom, bottomInset)
            }
        }
    }

    func dismiss() {
        if problem != nil { return }
        withViewportAnimation(.easeOut(duration: 0.2)) {
            viewport = .camera() // Reset the inset
        }
    }
}

