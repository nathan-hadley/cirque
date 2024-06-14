//
//  MapUtilities.swift
//  Cirque
//
//  Created by Nathan Hadley on 6/14/24.
//

import MapboxMaps

func getIntFromFeatureProperty(from properties: JSONObject?, forKey key: String) -> Int {
    if let propertyValue = properties?[key] {
        switch propertyValue {
        case .number(let numberValue):
            return Int(numberValue)
        case .string(let stringValue):
            return Int(stringValue) ?? -1
        default:
            return -1
        }
    }
    return -1
}
