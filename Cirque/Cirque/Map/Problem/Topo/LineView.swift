//
//  LineView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/25/24.
//

import SwiftUI

struct LineView: View {
    var problem: Problem
    var originalImageSize: CGSize
    var displayedImageSize: CGSize

    var body: some View {
        ZStack {
            LineShape(points: problem.line, originalImageSize: originalImageSize, displayedImageSize: displayedImageSize)
                .stroke(problem.color, lineWidth: 3)
            
            LineCapShape(points: problem.line, originalImageSize: originalImageSize, displayedImageSize: displayedImageSize)
                .fill(problem.color)
        }
    }
}
