//
//  LineCapShape.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/25/24.
//

import SwiftUI

struct LineCapShape: Shape {
    var points: [[Int]]
    var originalImageSize: CGSize
    var displayedImageSize: CGSize

    func path(in rect: CGRect) -> Path {
        var capPath = Path()
        
        guard let firstPoint = points.first else { return capPath }
        
        let scaleX = displayedImageSize.width / originalImageSize.width
        let scaleY = displayedImageSize.height / originalImageSize.height

        let startPoint = CGPoint(x: CGFloat(firstPoint[0]) * scaleX, y: CGFloat(firstPoint[1]) * scaleY)
        
        // Add a filled cap at the base of the line
        let capRadius: CGFloat = 5.0
        capPath.addEllipse(in: CGRect(
            x: startPoint.x - capRadius,
            y: startPoint.y - capRadius,
            width: capRadius * 2,
            height: capRadius * 2
        ))

        return capPath
    }
}
