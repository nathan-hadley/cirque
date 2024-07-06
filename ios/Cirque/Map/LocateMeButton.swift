//
//  LocateMeButton.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/20/24.
//

import SwiftUI
@_spi(Experimental) import MapboxMaps

@available(iOS 14.0, *)
struct LocateMeButton: View {
    @Binding var viewport: Viewport

    var body: some View {
        Button {
            withViewportAnimation(.default(maxDuration: 1)) {
                viewport = .followPuck(zoom: 16, bearing: .constant(0))
            }
        } label: {
            Image(systemName: imageName)
                .resizable()
                .frame(width: 21.5, height: 21.5)
                .transition(.scale.animation(.easeOut))
        }
        .safeContentTransition()
    }

    private var isFocusingUser: Bool {
        return viewport.followPuck?.bearing == .constant(0)
    }

    private var imageName: String {
        if isFocusingUser {
           return  "location.circle.fill"
        }
        return "location.circle"
    }
}

@available(iOS 13.0, *)
private extension View {
    func safeContentTransition() -> some View {
        if #available(iOS 17, *) {
            return self.contentTransition(.symbolEffect(.replace))
        }
        return self
    }
}
