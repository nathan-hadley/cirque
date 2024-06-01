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

    init() {
        offlineManager = OfflineManager()
        tileStore = TileStore.default
    }

    func downloadMapData(
        styleURI: StyleURI,
        coordinate: CLLocationCoordinate2D,
        zoomRange: ClosedRange<UInt8>,
        completion: @escaping (Result<Void, Error>) -> Void
    ) {
        let stylePackOptions = StylePackLoadOptions(
            glyphsRasterizationMode: .ideographsRasterizedLocally,
            acceptExpired: false
        )!

        offlineManager.loadStylePack(for: styleURI, loadOptions: stylePackOptions) { progress in
            //print("StylePack download progress: \(progress)")
        } completion: { result in
            switch result {
            case .success:
                print("StylePack downloaded successfully.")
                self.downloadTileRegion(styleURI: styleURI, coordinate: coordinate, zoomRange: zoomRange, completion: completion)
            case .failure(let error):
                print("Failed to download StylePack: \(error)")
                completion(.failure(error))
            }
        }
    }

    private func downloadTileRegion(styleURI: StyleURI, coordinate: CLLocationCoordinate2D, zoomRange: ClosedRange<UInt8>, completion: @escaping (Result<Void, Error>) -> Void) {
        let tilesetDescriptorOptions = TilesetDescriptorOptions(styleURI: styleURI, zoomRange: zoomRange, tilesets: nil)
        let tilesetDescriptor = offlineManager.createTilesetDescriptor(for: tilesetDescriptorOptions)

        let geometry = Geometry(Point(coordinate))
        let tileRegionLoadOptions = TileRegionLoadOptions(
            geometry: geometry,
            descriptors: [tilesetDescriptor],
            acceptExpired: false
        )!

        tileStore.loadTileRegion(forId: "Leavenworth", loadOptions: tileRegionLoadOptions) { progress in
            //print("TileRegion download progress: \(progress)")
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
}
