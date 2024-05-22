//
//  CirqueApp.swift
//  Cirque
//
//  Created by Nathan Hadley on 5/13/24.
//

import SwiftUI

@main
struct CirqueApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
