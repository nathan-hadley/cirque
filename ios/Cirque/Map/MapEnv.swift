//
//  MapEnv.swift
//  Cirque
//
//  Created by Nathan Hadley on 6/15/24.
//

@_spi(Experimental) import MapboxMaps

let INITIAL_ZOOM = 10.5
let INITIAL_CENTER = CLLocationCoordinate2D(latitude: 47.585, longitude: -120.713)
let STYLE_URI_STRING = "mapbox://styles/nathanhadley/clw9fowlu01kw01obbpsp3wiq"
let STYLE_URI = StyleURI(rawValue: STYLE_URI_STRING)!
let BBOX_COORDS = [[
    CLLocationCoordinate2D(latitude: 47.51, longitude: -120.94),
    CLLocationCoordinate2D(latitude: 47.75, longitude: -120.94),
    CLLocationCoordinate2D(latitude: 47.75, longitude: -120.58),
    CLLocationCoordinate2D(latitude: 47.51, longitude: -120.58)
]]
let BBOX_GEOMETRY = Geometry(Polygon(BBOX_COORDS))
let TILEPACK_ID = "Leavenworth"
let PROBLEMS_LAYER = "leavenworth-problems"
