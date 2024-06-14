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
    @Published var viewProblem = false
    @Published var viewport: Viewport = .camera(
        center: CLLocationCoordinate2D(latitude: 47.585, longitude: -120.713),
        zoom: 10.5,
        bearing: 0,
        pitch: 0
    )
    
    private var cancellable: Cancelable? = nil
    private var bottomInset: CGFloat = 0
    
    private var PROBLEM_LAYER = "leavenworth-problems"

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
                    return sourceLayer == PROBLEM_LAYER
                }
                return false
            }
            
            guard let firstFeature = filteredFeatures.first else {
                return
            }
            
            let newProblem = Problem(problem: firstFeature.queriedFeature.feature)
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
        
        let filter: [String: Any] = [
            "filter": [
                "all",
                ["==", ["get", "color"], "blue"],
                ["==", ["get", "subarea"], "Swiftwater"]
            ]
        ]

        let options = SourceQueryOptions(
            sourceLayerIds: [PROBLEM_LAYER],
            filter: filter
        )
        
        // Query the map for all problems in the same area with the same color
        map.querySourceFeatures(for: "composite", options: options) { [self] result in
            guard let features = try? result.get() else { return }
            
            var seenOrders = Set<Int>()
            let sortedFeatures = features
                .compactMap { feature -> QueriedSourceFeature? in
                    
                    let properties = feature.queriedFeature.feature.properties
                    let order = getIntFromFeatureProperty(from: properties, forKey: "order")
                    if !seenOrders.contains(order) {
                        seenOrders.insert(order)
                        return feature
                    }
                    return nil
                }
                .sorted { lhs, rhs in
                    let lhsProperties = lhs.queriedFeature.feature.properties
                    let lhsOrder = getIntFromFeatureProperty(from: lhsProperties, forKey: "order")
                    
                    let rhsProperties = rhs.queriedFeature.feature.properties
                    let rhsOrder = getIntFromFeatureProperty(from: rhsProperties, forKey: "order")

                    return lhsOrder < rhsOrder
                }
            
            // Tried just using problem.order - 1 to determine index
            // but the map query does not return some problems further away.
            // Maybe this would be solved by downloading maps?
            guard let currentIndex = sortedFeatures.firstIndex(where: {(
                $0.queriedFeature.feature.properties?["name"] as? Turf.JSONValue
            )?.stringValue ?? "" == currentProblem.name
            }) else {
                return
            }
            
            let newIndex = currentIndex + offset
            guard newIndex >= 0 && newIndex < sortedFeatures.count else { return }
            
            let newFeature = sortedFeatures[newIndex].queriedFeature.feature
            let newProblem = Problem(problem: newFeature)
            
            self.setNewProblem(problem: newProblem)
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
