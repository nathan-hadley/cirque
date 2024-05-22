//
//  ProblemView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/18/24.
//

import SwiftUI

@available(iOS 14.0, *)
struct ProblemView: View {
    let problem: Problem
    @State private var imageSize: CGSize = .zero

    var body: some View {
        GeometryReader { geometry in
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    
                    // Topo
                    if let topoName = problem.topo, let uiImage = UIImage(named: "\(topoName).jpeg") {
                        ZStack {
                            Image(uiImage: uiImage)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: geometry.size.width) // Full width
                                .clipped()
                                .background(
                                    GeometryReader { geo in
                                        Color.clear.preference(key: ImageSizeKey.self, value: geo.size)
                                    }
                                )
                                .onPreferenceChange(ImageSizeKey.self) { newSize in
                                    imageSize = newSize
                                }
                            
                            LineShape(points: problem.line, originalImageSize: uiImage.size, displayedImageSize: imageSize)
                                .stroke(Color.blue, lineWidth: 3)
                        }
                    } else {
                        VStack {
                            Image(systemName: "photo")
                                .font(.system(size: 64))
                                .foregroundColor(.black)
                            Text("No Topo")
                                .font(.title2)
                                .foregroundColor(.black)
                                .padding(.top, 6)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .padding(.top, 16)
                    }
                    
                    // Name & grade
                    HStack {
                        Text(problem.name)
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)
                            .lineLimit(1)
                            .truncationMode(.middle)
                            .minimumScaleFactor(0.5)
                        
                        Spacer()
                        
                        Text(problem.grade)
                            .font(.title)
                            .fontWeight(.bold)
                    }
                    .padding(.top, 4)
                    .padding(.horizontal)
                    
                    // Description
                    Text(problem.description ?? "")
                        .font(.body)
                        .padding(.horizontal)
                }
                .padding(.bottom)
            }
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

