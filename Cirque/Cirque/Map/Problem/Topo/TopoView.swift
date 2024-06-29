//
//  TopoView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/25/24.
//

import SwiftUI

@available(iOS 14.0, *)
struct TopoView: View {
    let problem: Problem
    let geometrySize: CGSize
    @State private var imageSize: CGSize = .zero

    var body: some View {
        if let topoName = problem.topo, let uiImage = UIImage(named: "\(topoName).jpeg") {
            ZStack {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: geometrySize.width) // Full width of sheet
                    .clipped()
                    .background(
                        GeometryReader { geo in
                            Color.clear.preference(key: ImageSizeKey.self, value: geo.size)
                        }
                    )
                    .onPreferenceChange(ImageSizeKey.self) { newSize in
                        imageSize = newSize
                    }
                
                LineView(
                    problem: problem,
                    originalImageSize: uiImage.size,
                    displayedImageSize: imageSize
                )
            }
        } else {
            VStack {
                Image(systemName: "photo")
                    .font(.system(size: 64))
                    .foregroundColor(Color.black)
                Text("No Topo")
                    .font(.title2)
                    .foregroundColor(Color.black)
                    .padding(.top, 6)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.top, 16)
        }
    }
}

struct ImageSizeKey: PreferenceKey {
    typealias Value = CGSize
    static var defaultValue: CGSize = .zero

    static func reduce(value: inout CGSize, nextValue: () -> CGSize) {
        value = nextValue()
    }
}
