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
                    TopoView(problem: problem, geometrySize: geometry.size)
                    InfoView(problem: problem)
                }
                .padding(.bottom)
            }
        }
    }
}
