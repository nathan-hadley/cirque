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
    var name: String?
    var grade: String?
    var order: Int?
    var color: Color
    var description: String?
    var line: [[Int]]
    var topo: String?
    var subarea: String?
    var coordinates: CLLocationCoordinate2D?

    init(problem: Feature) {
        let properties = problem.properties ?? [:]
        
        name = getString(from: properties, forKey: "name")
        grade = getString(from: properties, forKey: "grade")
        order = getInt(from: properties, forKey: "order")
        description = getString(from: properties, forKey: "description")
        topo = getString(from: properties, forKey: "topo")
        subarea = getString(from: properties, forKey: "subarea")
        
        let colorStr = getString(from: properties, forKey: "color")
        color = Problem.color(from: colorStr)
        
        let lineString = getString(from: properties, forKey: "line")
        line = Problem.parseTopoLine(from: lineString)
        
        if let geometry = problem.geometry,
           case let .point(point) = geometry {
            coordinates = point.coordinates
        } else {
            coordinates = nil
        }
    }
    
    static func parseTopoLine(from stringCoords: String?) -> [[Int]] {
        guard let string = stringCoords else { return [] }
        let jsonData = Data(string.utf8)
        
        do {
            if let jsonArray = try JSONSerialization.jsonObject(with: jsonData, options: []) as? [[Int]] {
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
