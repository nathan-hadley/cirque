//
//  LineView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/25/24.
//

import SwiftUI

struct LineView: View {
    var points: [[Int]]
    var originalImageSize: CGSize
    var displayedImageSize: CGSize

    var body: some View {
        ZStack {
            LineShape(points: points, originalImageSize: originalImageSize, displayedImageSize: displayedImageSize)
                .stroke(Color.blue, lineWidth: 3)
            
            LineCapShape(points: points, originalImageSize: originalImageSize, displayedImageSize: displayedImageSize)
                .fill(Color.blue)
        }
    }
}
