import SwiftUI
import MapKit

/// Map view showing tracks and entry locations
struct MapView: View {
    @EnvironmentObject var appState: AppState
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 48.1351, longitude: 11.5820), // Munich
        span: MKCoordinateSpan(latitudeDelta: 0.5, longitudeDelta: 0.5)
    )
    @State private var showingGuide = false
    @State private var guideText: String?
    
    var body: some View {
        NavigationStack {
            ZStack {
                Map(coordinateRegion: $region, showsUserLocation: true)
                    .ignoresSafeArea(edges: .bottom)
                
                VStack {
                    Spacer()
                    
                    // Guide button
                    if appState.settings.guideMode != .off {
                        Button {
                            fetchGuideInfo()
                        } label: {
                            HStack {
                                Image(systemName: "info.circle.fill")
                                Text("Reiseführer")
                            }
                            .padding()
                            .background(.ultraThinMaterial)
                            .cornerRadius(12)
                        }
                        .padding()
                    }
                }
                
                // Guide popup
                if let text = guideText {
                    VStack {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("🗺️ Reiseführer")
                                    .font(.headline)
                                Spacer()
                                Button {
                                    guideText = nil
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.secondary)
                                }
                            }
                            Text(text)
                                .font(.body)
                        }
                        .padding()
                        .background(.ultraThickMaterial)
                        .cornerRadius(16)
                        .padding()
                        
                        Spacer()
                    }
                }
            }
            .navigationTitle("Karte")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        centerOnUser()
                    } label: {
                        Image(systemName: "location.fill")
                    }
                }
            }
        }
    }
    
    private func centerOnUser() {
        if let location = appState.locationService.currentLocation {
            region.center = location.coordinate
        }
    }
    
    private func fetchGuideInfo() {
        guard let location = appState.locationService.currentLocation else {
            guideText = "Standort nicht verfügbar."
            return
        }
        
        Task {
            do {
                let response = try await appState.apiService.getGuidePOI(
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude,
                    mode: appState.settings.guideMode.rawValue.lowercased()
                )
                await MainActor.run {
                    guideText = response.text
                }
            } catch {
                await MainActor.run {
                    guideText = "Konnte keine POI-Informationen laden."
                }
            }
        }
    }
}

#Preview {
    MapView()
        .environmentObject(AppState())
}
