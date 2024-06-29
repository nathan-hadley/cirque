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
    
    func updateMapData() {
        downloadStylePack { result in
            switch result {
            case .success:
                print("Download completed successfully.")
                self.downloadTileRegion()
            case .failure(let error):
                print("Download failed with error: \(error)")
            }
        }

    }
    
    private func downloadStylePack(completion: @escaping (Result<Void, Error>) -> Void) {
        let stylePackOptions = StylePackLoadOptions(
            glyphsRasterizationMode: .ideographsRasterizedLocally,
            metadata: ["id": TILEPACK_ID],
            acceptExpired: false
        )!
        
        offlineManager.loadStylePack(
            for: STYLE_URI,
            loadOptions: stylePackOptions
        ) { result in
            switch result {
            case .success:
                print("StylePack downloaded successfully.")
                completion(.success(()))
            case .failure(let error):
                print("Failed to download StylePack: \(error)")
                completion(.failure(error))
            }
        }
    }
    
    private func downloadTileRegion() {
        let tilesetDescriptorOptions = TilesetDescriptorOptions(
            styleURI: STYLE_URI,
            zoomRange: 10...20,
            tilesets: nil
        )
        let tilesetDescriptor = offlineManager.createTilesetDescriptor(for: tilesetDescriptorOptions)

        let tileRegionLoadOptions = TileRegionLoadOptions(
            geometry: BBOX_GEOMETRY,
            descriptors: [tilesetDescriptor],
            acceptExpired: false
        )!
        
        tileStore.loadTileRegion(
            forId: TILEPACK_ID,
            loadOptions: tileRegionLoadOptions
        ) { result in
            switch result {
            case .success:
                print("TileRegion downloaded successfully.")
            case .failure(let error):
                print("Failed to download TileRegion: \(error)")
            }
        }
    }
}

    
//    func updateMapData() {
//        stylePackExists() { exists in
//            if exists {
//                self.updateSylePack()
//            } else {
//                self.downloadStylePack()
//            }
//        }
//
//        tileRegionExists() { exists in
//            if exists {
//                self.updateTileRegion()
//            } else {
//                self.downloadTileRegion()
//            }
//        }
//    }
    
//    private func stylePackExists(completion: @escaping (Bool) -> Void) {
//        offlineManager.allStylePacks { result in
//            switch result {
//            case let .success(stylePacks):
//                for stylePack in stylePacks {
//                    if stylePack.styleURI == STYLE_URI_STRING {
//                        completion(true)
//                        return
//                    }
//                }
//                completion(false)
//            case .failure:
//                completion(false)
//            }
//        }
//    }

    
//    private func tileRegionExists(completion: @escaping (Bool) -> Void) {
//        tileStore.allTileRegions { result in
//            switch result {
//            case let .success(tileRegions):
//                for region in tileRegions {
//                    if region.id == TILEPACK_ID {
//                        completion(true)
//                        return
//                    }
//                }
//                completion(false)
//            case .failure:
//                completion(false)
//            }
//        }
//    }
    
//    private func updateSylePack() {
//        let emptyStylePackOptions = StylePackLoadOptions(
//            glyphsRasterizationMode: .ideographsRasterizedLocally
//        )!
//        
//        offlineManager.loadStylePack(
//            for: STYLE_URI,
//            loadOptions: emptyStylePackOptions
//        ) { result in
//            switch result {
//            case .success:
//                print("StylePack updated successfully.")
//            case .failure(let error):
//                print("Failed to upate StylePack: \(error)")
//            }
//        }
//    }
    
//    private func updateTileRegion() {
//        let emptyTileRegionLoadOptions = TileRegionLoadOptions(
//            geometry: BBOX_GEOMETRY
//        )!
//        
//        tileStore.loadTileRegion(
//            forId: TILEPACK_ID,
//            loadOptions: emptyTileRegionLoadOptions
//        ) { result in
//            switch result {
//            case .success:
//                print("TileRegion updated successfully.")
//            case .failure(let error):
//                print("Failed to upate TileRegion: \(error)")
//            }
//        }
//    }
