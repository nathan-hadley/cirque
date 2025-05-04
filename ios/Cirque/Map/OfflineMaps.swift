//
//  OfflineMapDownloader.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/30/24.
//

import MapboxMaps
import SwiftUI

class OfflineMaps: ObservableObject {
    @Published var mapDownloaded: Bool = false
    @Published var successMessage: String = ""
    @Published var errorMessage: String = ""
    @Published var loading: Bool = false
    
    private var offlineManager: OfflineManager
    private var tileStore: TileStore
    
    init() {
        offlineManager = OfflineManager()
        tileStore = TileStore.default
        
        stylePackExists() { exists in
            DispatchQueue.main.async {
                self.mapDownloaded = exists
            }
        }
    }
    
    func updateMapData() {
        successMessage = ""
        errorMessage = ""
        loading = true
        
        if mapDownloaded {
            updateSylePack { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success:
                        self.successMessage = "Style pack updated."
                        
                        self.updateTileRegion() { result in
                            DispatchQueue.main.async {
                                self.loading = false
                                switch result {
                                case .success:
                                    self.successMessage += "\nTile regions updated.\nMap updated successfully."
                                case .failure(let error):
                                    self.errorMessage = "Tile regions update failed with error: \(error)"
                                }
                            }
                        }
                    case .failure(let error):
                        self.loading = false
                        self.errorMessage = "Style pack update failed with error: \(error)"
                    }
                }
            }
            
        } else {
            downloadStylePack { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success:
                        self.successMessage = "Style pack downloaded."
                        
                        self.downloadTileRegion() { result in
                            DispatchQueue.main.async {
                                self.loading = false
                                switch result {
                                case .success:
                                    self.mapDownloaded = true
                                    self.successMessage += "\nTile regions downloaded.\nMap downloaded successfully."
                                case .failure(let error):
                                    self.errorMessage = "Tile region download failed with error: \(error)"
                                }
                            }
                        }
                    case .failure(let error):
                        self.loading = false
                        self.errorMessage = "Style pack download failed with error: \(error)"
                    }
                }
            }
        }
    }
    
    private func stylePackExists(completion: @escaping (Bool) -> Void) {
        offlineManager.allStylePacks { result in
            switch result {
            case let .success(stylePacks):
                for stylePack in stylePacks {
                    if stylePack.styleURI == STYLE_URI_STRING {
                        completion(true)
                        return
                    }
                }
                completion(false)
            case .failure:
                completion(false)
            }
        }
    }
    
    private func updateSylePack(completion: @escaping (Result<Void, Error>) -> Void) {
        let emptyStylePackOptions = StylePackLoadOptions(
            glyphsRasterizationMode: .ideographsRasterizedLocally
        )!
        
        offlineManager.loadStylePack(
            for: STYLE_URI,
            loadOptions: emptyStylePackOptions
        ) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    print("StylePack updated successfully.")
                    completion(.success(()))
                case .failure(let error):
                    print("Failed to upate StylePack: \(error)")
                    completion(.failure(error))
                }
            }
        }
    }
    
    private func updateTileRegion(completion: @escaping (Result<Void, Error>) -> Void) {
        let emptyTileRegionLoadOptions = TileRegionLoadOptions(
            geometry: BBOX_GEOMETRY
        )!
        
        tileStore.loadTileRegion(
            forId: TILEPACK_ID,
            loadOptions: emptyTileRegionLoadOptions
        ) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    print("TileRegion updated successfully.")
                    completion(.success(()))
                case .failure(let error):
                    print("Failed to upate TileRegion: \(error)")
                    completion(.failure(error))
                }
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
            DispatchQueue.main.async {
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
    }
    
    private func downloadTileRegion(completion: @escaping (Result<Void, Error>) -> Void) {
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
            DispatchQueue.main.async {
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
}
