//
//  CircuitNavButtons.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/27/24.
//

import SwiftUI
@_spi(Experimental) import MapboxMaps

struct CircuitNavButtons: View {
    let mapViewModel: MapViewModel
    let map: MapboxMap?
    
    var body: some View {
        HStack {
            Button(action: {
                mapViewModel.showPreviousProblem(map: map)
            }) {
                Image(systemName: "arrow.left")
                    .foregroundColor(self.color)
                    .padding()
                    .background(Color.white)
                    .clipShape(Circle())
                    .shadow(radius: 2)
            }
            
            Spacer()
            
            Button(action: {
                mapViewModel.showNextProblem(map: map)
            }) {
                Image(systemName: "arrow.right")
                    .foregroundColor(self.color)
                    .padding()
                    .background(Color.white)
                    .clipShape(Circle())
                    .shadow(radius: 2)
            }
        }
    }
        
    private var color: Color {
        if mapViewModel.problem?.color == Color.white {
            return Color.black
        }
        return mapViewModel.problem?.color ?? Color.black
    }
}

