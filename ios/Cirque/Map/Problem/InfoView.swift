//
//  InfoView.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/25/24.
//

import SwiftUI

@available(iOS 14.0, *)
struct InfoView: View {
    let problem: Problem

    var body: some View {
        HStack {
            Text(problem.name ?? "Unknown")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(.primary)
                .lineLimit(1)
                .truncationMode(.middle)
                .minimumScaleFactor(0.5)
         
            Spacer()
         
            Text(problem.grade ?? "")
                .font(.title)
                .fontWeight(.bold)
        }
        .padding(.top, 4)
        .padding(.horizontal)
      
        Text(problem.description ?? "")
            .font(.body)
            .padding(.horizontal)
    }
}
