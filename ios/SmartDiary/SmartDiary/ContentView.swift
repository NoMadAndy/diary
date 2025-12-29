import SwiftUI

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        TabView {
            TimelineView()
                .tabItem {
                    Label("Timeline", systemImage: "clock")
                }
            
            RecordView()
                .tabItem {
                    Label("Aufnehmen", systemImage: "plus.circle.fill")
                }
            
            MapView()
                .tabItem {
                    Label("Karte", systemImage: "map")
                }
            
            ChangelogView()
                .tabItem {
                    Label("Neu", systemImage: "sparkles")
                }
            
            SettingsView()
                .tabItem {
                    Label("Einstellungen", systemImage: "gear")
                }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AppState())
}
