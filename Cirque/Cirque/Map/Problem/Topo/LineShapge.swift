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

        let startPoint = CGPoint(x: CGFloat(firstPoint[0]) * scaleX, y: CGFloat(firstPoint[1]) * scaleY)
        path.move(to: startPoint)
        
        for point in points.dropFirst() {
            let nextPoint = CGPoint(x: CGFloat(point[0]) * scaleX, y: CGFloat(point[1]) * scaleY)
            path.addLine(to: nextPoint)
        }
        
        return path
    }
}
