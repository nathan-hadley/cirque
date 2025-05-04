//
//  LineShapge.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/25/24.
//

import SwiftUI

struct LineShape: Shape {
    var points: [[Int]]
    var originalImageSize: CGSize
    var displayedImageSize: CGSize

    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        guard let firstPoint = points.first else { return path }
        
        let scaleX = displayedImageSize.width / originalImageSize.width
        let scaleY = displayedImageSize.height / originalImageSize.height

        var startPoint = CGPoint(x: CGFloat(firstPoint[0]) * scaleX, y: CGFloat(firstPoint[1]) * scaleY)
        path.move(to: startPoint)
        
        // For quadratic Bezier curves
        for i in 1..<points.count {
            let nextPoint = CGPoint(x: CGFloat(points[i][0]) * scaleX, y: CGFloat(points[i][1]) * scaleY)
            let midPoint = CGPoint(
                x: (startPoint.x + nextPoint.x) / 2,
                y: (startPoint.y + nextPoint.y) / 2
            )
            path.addQuadCurve(to: midPoint, control: startPoint)
            startPoint = nextPoint
        }
        path.addLine(to: startPoint)

        return path
    }
}

