//
//  MapUtilities.swift
//  Cirque
//
//  Created by Nathan Hadley on 6/14/24.
//

import MapboxMaps

func getInt(from featureProperties: JSONObject?, forKey key: String) -> Int? {
    if let propertyValue = featureProperties?[key] {
        switch propertyValue {
        case .number(let numberValue):
            return Int(numberValue)
        case .string(let stringValue):
            return Int(stringValue) ?? nil
        default:
            return nil
        }
    }
    return nil
}

func getString(from featureProperties: JSONObject?, forKey key: String) -> String? {
    if let propertyValue = featureProperties?[key] {
        switch propertyValue {
        case .string(let stringValue):
            return String(stringValue)
        case .number(let numberValue):
            return String(numberValue)
        default:
            return nil
        }
    }
    return nil
}
