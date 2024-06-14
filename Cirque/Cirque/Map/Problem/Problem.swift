//
//  Problem.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/18/24.
//

import Turf
import SwiftUI
@_spi(Experimental) import MapboxMaps

@available(iOS 14.0, *)

struct Problem: Identifiable {
    var id = UUID()
    var name: String
    var grade: String
    var order: Int?
    var color: Color
    var description: String?
    var line: [[Int]]
    var topo: String?
    var subarea: String?
    var coordinates: CLLocationCoordinate2D?

    init(problem: Feature) {
        let properties = problem.properties ?? [:]
        name = (properties["name"] as? Turf.JSONValue)?.stringValue ?? "N/A"
        grade = (properties["grade"] as? Turf.JSONValue)?.stringValue ?? "N/A"
        order = getIntFromFeatureProperty(from: properties, forKey: "order")
        
        let colorStr = (properties["color"] as? Turf.JSONValue)?.stringValue
        color = Problem.color(from: colorStr)
        description = (properties["description"] as? Turf.JSONValue)?.stringValue
        
        let lineString = (properties["line"] as? Turf.JSONValue)?.stringValue ?? "[]"
        line = Problem.parseCoordinates(from: lineString)
        
        topo = (properties["topo"] as? Turf.JSONValue)?.stringValue
        subarea = (properties["subarea"] as? Turf.JSONValue)?.stringValue
        
        if let geometry = problem.geometry,
           case let .point(point) = geometry {
            coordinates = point.coordinates
        } else {
            coordinates = nil
        }
    }
    
    static func parseCoordinates(from string: String) -> [[Int]] {
        let data = Data(string.utf8)
        
        do {
            // Parse the JSON data
            if let jsonArray = try JSONSerialization.jsonObject(with: data, options: []) as? [[Int]] {
                return jsonArray
            }
        } catch {
            print("Failed to parse topo line coordinates: \(error.localizedDescription)")
        }
        
        return []
    }
    
    static func color(from colorString: String?) -> Color {
        switch colorString {
        case "blue":
            return Color.blue
        case "white":
            return Color.white
        case "red":
            return Color.red
        case "orange":
            return Color.orange
        case "yellow":
            return Color.yellow
        case "black":
            return Color.black
        default:
            return Color.black
        }
    }
}


extension Turf.JSONValue {
    var stringValue: String? {
        switch self {
        case .string(let value):
            return value
        default:
            return nil
        }
    }
}

