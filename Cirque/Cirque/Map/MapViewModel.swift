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
    @Published var problem: Problem? = nil
    @Published var viewProblem = false
    @Published var viewport: Viewport = .camera(
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        bearing: 0,
        pitch: 0
    )
    
    private var cancellable: Cancelable? = nil
    private var bottomInset: CGFloat = 0

    func mapTapped(
        _ context: MapContentGestureContext,
        map: MapboxMap?,
        bottomInset: CGFloat
    ) {
        cancellable?.cancel()
        guard let map = map else { return }
        
        self.bottomInset = bottomInset
        
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
                    return sourceLayer == PROBLEMS_LAYER
                }
                return false
            }
            
            guard let firstFeature = filteredFeatures.first else {
                return
            }
            
            let newProblem = Problem(feature: firstFeature.queriedFeature.feature)
            self.setNewProblem(problem: newProblem)
        }
    }
    
    func showPreviousProblem(map: MapboxMap?) {
        guard let currentProblem = problem else { return }
        fetchAdjacentProblem(
            map: map,
            currentProblem: currentProblem,
            offset: -1
        )
    }
    
    func showNextProblem(map: MapboxMap?) {
        guard let currentProblem = problem else { return }
        fetchAdjacentProblem(
            map: map,
            currentProblem: currentProblem,
            offset: 1
        )
    }
    
    private func fetchAdjacentProblem(
        map: MapboxMap?,
        currentProblem: Problem,
        offset: Int
    ) {
        guard let map = map else { return }
        guard let currentProblemOrder = currentProblem.order else {
            return
        }
        
        let newProblemOrder = currentProblemOrder + offset
        
        let filter: [Any] = [
            "all",
            ["==", ["get", "color"], currentProblem.colorStr],
            ["==", ["get", "subarea"], currentProblem.subarea ?? ""],
            ["any",
                ["==", ["get", "order"], "\(newProblemOrder)"],
                ["==", ["get", "order"], newProblemOrder]
            ]
        ]

        let options = SourceQueryOptions(
            sourceLayerIds: [PROBLEMS_LAYER],
            filter: filter
        )
        
        // Query the map for all problems in the same area with the same color
        map.querySourceFeatures(for: "composite", options: options) { [self] result in
            guard let features = try? result.get() else { return }
            
            if let newFeature = features.first?.queriedFeature.feature {
                let newProblem = Problem(feature: newFeature)
                self.setNewProblem(problem: newProblem)
            } else {
                print("No feature found with order \(newProblemOrder)")
            }
        }
    }
    
    private func setNewProblem(problem: Problem) {
        self.problem = problem
        self.viewProblem = true
        
        withViewportAnimation(.easeOut(duration: 0.5)) {
            self.viewport = .camera(center: problem.coordinates)
                .padding(.bottom, self.bottomInset)
        }
    }
}
