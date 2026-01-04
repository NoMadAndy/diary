import SwiftUI
import MapKit

/// View for displaying activity suggestions at a destination
struct ActivitiesView: View {
    @EnvironmentObject var appState: AppState
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var suggestions: ActivitySuggestionsResponse?
    @State private var selectedInterests: Set<String> = []
    @State private var useCurrentLocation = true
    @State private var manualLatitude: String = ""
    @State private var manualLongitude: String = ""
    
    let availableInterests = ["Kultur", "Natur", "Sport", "Essen", "Geschichte", "Kunst", "Shopping", "Familie"]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Location input
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Standort", systemImage: "location")
                            .font(.headline)
                        
                        Toggle("Aktuellen Standort nutzen", isOn: $useCurrentLocation)
                        
                        if !useCurrentLocation {
                            HStack {
                                TextField("Breitengrad", text: $manualLatitude)
                                    .keyboardType(.decimalPad)
                                    .textFieldStyle(.roundedBorder)
                                TextField("Längengrad", text: $manualLongitude)
                                    .keyboardType(.decimalPad)
                                    .textFieldStyle(.roundedBorder)
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(radius: 2)
                    
                    // Interests selection
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Interessen", systemImage: "heart")
                            .font(.headline)
                        
                        FlowLayout(spacing: 8) {
                            ForEach(availableInterests, id: \.self) { interest in
                                Button {
                                    if selectedInterests.contains(interest) {
                                        selectedInterests.remove(interest)
                                    } else {
                                        selectedInterests.insert(interest)
                                    }
                                } label: {
                                    Text(interest)
                                        .font(.subheadline)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(selectedInterests.contains(interest) ? Color.blue : Color.gray.opacity(0.2))
                                        .foregroundColor(selectedInterests.contains(interest) ? .white : .primary)
                                        .cornerRadius(20)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(radius: 2)
                    
                    // Search button
                    Button {
                        loadSuggestions()
                    } label: {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "magnifyingglass")
                            }
                            Text("Aktivitäten vorschlagen")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isLoading || (!useCurrentLocation && (manualLatitude.isEmpty || manualLongitude.isEmpty)))
                    
                    // Error message
                    if let error = errorMessage {
                        HStack {
                            Image(systemName: "exclamationmark.triangle")
                                .foregroundColor(.orange)
                            Text(error)
                                .font(.subheadline)
                        }
                        .padding()
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(8)
                    }
                    
                    // Results
                    if let suggestions = suggestions {
                        SuggestionsCard(suggestions: suggestions)
                    }
                }
                .padding()
            }
            .background(Color.gray.opacity(0.05))
            .navigationTitle("Aktivitäten")
        }
    }
    
    private func loadSuggestions() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let latitude: Double
                let longitude: Double
                
                if useCurrentLocation {
                    guard let location = appState.locationService.currentLocation else {
                        await MainActor.run {
                            errorMessage = "Standort nicht verfügbar. Bitte aktiviere die Standortdienste."
                            isLoading = false
                        }
                        return
                    }
                    latitude = location.coordinate.latitude
                    longitude = location.coordinate.longitude
                } else {
                    guard let lat = Double(manualLatitude), let lon = Double(manualLongitude) else {
                        await MainActor.run {
                            errorMessage = "Ungültige Koordinaten"
                            isLoading = false
                        }
                        return
                    }
                    latitude = lat
                    longitude = lon
                }
                
                let interests = selectedInterests.isEmpty ? nil : Array(selectedInterests)
                let result = try await appState.apiService.suggestActivities(
                    latitude: latitude,
                    longitude: longitude,
                    interests: interests
                )
                
                await MainActor.run {
                    self.suggestions = result
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.errorMessage = "Fehler beim Laden: \(error.localizedDescription)"
                    self.isLoading = false
                }
            }
        }
    }
}

// MARK: - Suggestions Card

struct SuggestionsCard: View {
    let suggestions: ActivitySuggestionsResponse
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Location header
            HStack {
                Image(systemName: "mappin.circle.fill")
                    .foregroundColor(.red)
                Text(suggestions.location)
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            // Activities
            VStack(alignment: .leading, spacing: 16) {
                Text("Empfohlene Aktivitäten")
                    .font(.headline)
                
                ForEach(Array(suggestions.activities.enumerated()), id: \.offset) { index, activity in
                    ActivityCard(activity: activity, number: index + 1)
                }
            }
            
            // Guided tour
            if let tour = suggestions.guidedTour {
                Divider()
                    .padding(.vertical, 8)
                
                GuidedTourCard(tour: tour)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(radius: 2)
    }
}

struct ActivityCard: View {
    let activity: ActivitySuggestion
    let number: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                ZStack {
                    Circle()
                        .fill(Color.blue)
                        .frame(width: 30, height: 30)
                    Text("\(number)")
                        .foregroundColor(.white)
                        .fontWeight(.bold)
                }
                
                VStack(alignment: .leading) {
                    Text(activity.name)
                        .font(.headline)
                    Text(activity.category)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                if let duration = activity.estimatedDuration {
                    VStack {
                        Image(systemName: "clock")
                            .font(.caption)
                        Text("\(duration) min")
                            .font(.caption2)
                    }
                    .foregroundColor(.secondary)
                }
            }
            
            Text(activity.description)
                .font(.subheadline)
                .foregroundColor(.primary)
            
            HStack {
                Image(systemName: "lightbulb")
                    .font(.caption)
                    .foregroundColor(.yellow)
                Text(activity.recommendationReason)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 4)
        }
        .padding()
        .background(Color.gray.opacity(0.05))
        .cornerRadius(12)
    }
}

struct GuidedTourCard: View {
    let tour: GuidedTour
    @State private var showingMap = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "figure.walk")
                    .font(.title2)
                    .foregroundColor(.green)
                
                VStack(alignment: .leading) {
                    Text("Geführte Tour")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(tour.name)
                        .font(.headline)
                }
                
                Spacer()
                
                VStack {
                    Image(systemName: "clock")
                    Text("\(tour.duration) min")
                        .font(.caption)
                }
                .foregroundColor(.secondary)
            }
            
            Text(tour.description)
                .font(.subheadline)
            
            // Tour stops
            VStack(alignment: .leading, spacing: 8) {
                Text("Stopps (\(tour.stops.count))")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                
                ForEach(tour.stops.sorted(by: { $0.order < $1.order }), id: \.order) { stop in
                    HStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .stroke(Color.green, lineWidth: 2)
                                .frame(width: 24, height: 24)
                            Text("\(stop.order)")
                                .font(.caption2)
                                .fontWeight(.bold)
                        }
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(stop.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text(stop.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .padding(.top, 8)
            
            Button {
                showingMap = true
            } label: {
                HStack {
                    Image(systemName: "map")
                    Text("Auf Karte anzeigen")
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(Color.green.opacity(0.1))
                .foregroundColor(.green)
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color.green.opacity(0.05))
        .cornerRadius(12)
        .sheet(isPresented: $showingMap) {
            TourMapView(tour: tour)
        }
    }
}

// MARK: - Tour Map View

struct TourMapView: View {
    let tour: GuidedTour
    @Environment(\.dismiss) var dismiss
    @State private var region: MKCoordinateRegion
    
    init(tour: GuidedTour) {
        self.tour = tour
        
        // Calculate center and span from stops
        let coordinates = tour.stops.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) }
        let minLat = coordinates.map { $0.latitude }.min() ?? 0
        let maxLat = coordinates.map { $0.latitude }.max() ?? 0
        let minLon = coordinates.map { $0.longitude }.min() ?? 0
        let maxLon = coordinates.map { $0.longitude }.max() ?? 0
        
        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLon + maxLon) / 2
        )
        let span = MKCoordinateSpan(
            latitudeDelta: (maxLat - minLat) * 1.5,
            longitudeDelta: (maxLon - minLon) * 1.5
        )
        
        _region = State(initialValue: MKCoordinateRegion(center: center, span: span))
    }
    
    var body: some View {
        NavigationStack {
            Map(coordinateRegion: $region, annotationItems: tour.stops) { stop in
                MapAnnotation(coordinate: CLLocationCoordinate2D(latitude: stop.latitude, longitude: stop.longitude)) {
                    VStack {
                        ZStack {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 30, height: 30)
                            Text("\(stop.order)")
                                .foregroundColor(.white)
                                .fontWeight(.bold)
                                .font(.caption)
                        }
                        Text(stop.name)
                            .font(.caption2)
                            .padding(4)
                            .background(Color.white)
                            .cornerRadius(4)
                            .shadow(radius: 2)
                    }
                }
            }
            .navigationTitle(tour.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Fertig") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    ActivitiesView()
        .environmentObject(AppState())
}
