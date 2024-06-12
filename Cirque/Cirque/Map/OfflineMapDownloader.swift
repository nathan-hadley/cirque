//
//  OfflineMapDownloader.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/30/24.
//

import MapboxMaps

class OfflineMapDownloader {
    private var offlineManager: OfflineManager
    private var tileStore: TileStore
    
    private var styleURI = StyleURI(rawValue: "mapbox://styles/nathanhadley/clw9fowlu01kw01obbpsp3wiq")!
    
    private var boundingBoxCoordinates = [[
        CLLocationCoordinate2D(latitude: 47.51, longitude: -120.94),
        CLLocationCoordinate2D(latitude: 47.75, longitude: -120.94),
        CLLocationCoordinate2D(latitude: 47.75, longitude: -120.58),
        CLLocationCoordinate2D(latitude: 47.51, longitude: -120.58)
    ]]
    
    private var coordinate = CLLocationCoordinate2D(latitude: 47.585, longitude: -120.713)
    
    private var stylePackOptions = StylePackLoadOptions(
        glyphsRasterizationMode: .ideographsRasterizedLocally,
        metadata: ["id": "Leavenworth"],
        acceptExpired: false
    )!
    
    private var tilesetDescriptorOptions: TilesetDescriptorOptions
    private var tilesetDescriptor: TilesetDescriptor
    private var tileRegionLoadOptions: TileRegionLoadOptions

    init() {
        offlineManager = OfflineManager()
        tileStore = TileStore.default
        
        tilesetDescriptorOptions = TilesetDescriptorOptions(
            styleURI: styleURI,
            zoomRange: 10...20,
            tilesets: nil
        )
        tilesetDescriptor = offlineManager.createTilesetDescriptor(for: tilesetDescriptorOptions)

        //let geometry = Geometry(Polygon(boundingBoxCoordinates))
        let geometry = Geometry(Point(coordinate))
        tileRegionLoadOptions = TileRegionLoadOptions(
            geometry: geometry,
            descriptors: [tilesetDescriptor],
            acceptExpired: false
        )!
    }

    func downloadMapData(completion: @escaping (Result<Void, Error>) -> Void) {
        offlineManager.loadStylePack(for: styleURI, loadOptions: self.stylePackOptions) { progress in
            // print("StylePack download progress: \(progress)")
        } completion: { result in
            switch result {
            case .success:
                print("StylePack downloaded successfully.")
                self.downloadTileRegion(completion: completion)
            case .failure(let error):
                print("Failed to download StylePack: \(error)")
                completion(.failure(error))
            }
        }
    }

    private func downloadTileRegion(completion: @escaping (Result<Void, Error>) -> Void) {
        tileStore.loadTileRegion(forId: "Leavenworth", loadOptions: tileRegionLoadOptions) { progress in
            // print("TileRegion download progress: \(progress)")
        } completion: { result in
            switch result {
            case .success:
                print("TileRegion downloaded successfully.")
                completion(.success(()))
            case .failure(let error):
                print("Failed to download TileRegion: \(error)")
                completion(.failure(error))
            }
        }
    }
    
// TODO: Figure out correct way to update maps
//    func updateMapData(completion: @escaping (Result<Void, Error>) -> Void) {
//        self.updateSylePack() { result in
//            switch result {
//            case .success:
//                print("Map data updated successfully.")
//                self.updateTileRegion(completion: completion)
//            case .failure(let error):
//                print("Failed to update map data: \(error)")
//                // Attempt to download map data.
//                self.downloadMapData(completion: completion)
//            }
//        }
//    }
//    
//    private func updateSylePack(completion: @escaping (Result<Void, Error>) -> Void) {
//        offlineManager.allStylePacks { result in
//            switch result {
//            case let .success(_stylePacks):
//                self.offlineManager.loadStylePack(
//                    for: self.styleURI,
//                    loadOptions: self.stylePackOptions
//                ) { result in
//                    switch result {
//                    case .success:
//                        print("StylePack updated successfully.")
//                        self.updateTileRegion(completion: completion)
//                    case .failure(let error):
//                        print("Failed to upate StylePack: \(error)")
//                        completion(.failure(error))
//                    }
//                }
//            case .failure(let error):
//                print("Failed to find StylePacks: \(error)")
//                completion(.failure(error))
//            }
//        }
//    }
//    
//    private func updateTileRegion(completion: @escaping (Result<Void, Error>) -> Void) {
//        tileStore.allTileRegions { result in
//            switch result {
//            case let .success(_tileRegions):
//                self.tileStore.loadTileRegion(
//                    forId: "Leavenworth",
//                    loadOptions: self.tileRegionLoadOptions
//                ) { result in
//                    switch result {
//                    case .success:
//                        print("TileRegion updated successfully.")
//                        completion(.success(()))
//                    case .failure(let error):
//                        print("Failed to upate TileRegion: \(error)")
//                        completion(.failure(error))
//                    }
//                }
//            case .failure(let error):
//                print("Failed to find TileRegions: \(error)")
//                completion(.failure(error))
//            }
//        }
//    }
}
