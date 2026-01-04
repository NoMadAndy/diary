import Foundation
import Combine
import CoreLocation

/// Service for syncing local data with the backend
class SyncService: ObservableObject {
    @Published var isSyncing: Bool = false
    @Published var lastSyncDate: Date?
    @Published var pendingUploads: Int = 0
    @Published var lastError: String?
    
    private var cancellables = Set<AnyCancellable>()
    private var apiService: APIService
    
    private var pendingEntries: [CreateEntryRequest] = []
    private var pendingTracks: [CreateTrackRequest] = []
    
    init(apiService: APIService) {
        self.apiService = apiService
    }
    
    // MARK: - Public Methods
    
    func sync() async {
        await MainActor.run {
            isSyncing = true
            lastError = nil
        }
        
        do {
            // 1. Upload pending entries
            for entry in pendingEntries {
                do {
                    let _ = try await apiService.createEntry(entry)
                    await MainActor.run {
                        pendingEntries.removeAll { $0.content == entry.content }
                        updatePendingCount()
                    }
                } catch {
                    print("Failed to upload entry: \(error)")
                    await MainActor.run {
                        lastError = "Fehler beim Hochladen eines Eintrags: \(error.localizedDescription)"
                    }
                }
            }
            
            // 2. Upload pending tracks
            for track in pendingTracks {
                do {
                    let _ = try await apiService.createTrack(track)
                    await MainActor.run {
                        pendingTracks.removeAll { $0.name == track.name }
                        updatePendingCount()
                    }
                } catch {
                    print("Failed to upload track: \(error)")
                    await MainActor.run {
                        lastError = "Fehler beim Hochladen eines Tracks: \(error.localizedDescription)"
                    }
                }
            }
            
            await MainActor.run {
                isSyncing = false
                lastSyncDate = Date()
            }
        }
    }
    
    func addPendingEntry(_ entry: CreateEntryRequest) {
        pendingEntries.append(entry)
        updatePendingCount()
    }
    
    func addPendingTrack(_ track: CreateTrackRequest) {
        pendingTracks.append(track)
        updatePendingCount()
    }
    
    func addPendingTrackFromLocations(_ locations: [CLLocation], name: String?, description: String?, entryId: Int? = nil) {
        let trackPoints = locations.map { location in
            CreateTrackRequest.TrackPoint(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                elevation: location.altitude,
                timestamp: ISO8601DateFormatter().string(from: location.timestamp)
            )
        }
        
        let startDate = locations.first?.timestamp
        let endDate = locations.last?.timestamp
        
        let track = CreateTrackRequest(
            name: name,
            description: description,
            entryId: entryId,
            trackData: trackPoints,
            startedAt: startDate.map { ISO8601DateFormatter().string(from: $0) },
            endedAt: endDate.map { ISO8601DateFormatter().string(from: $0) }
        )
        
        addPendingTrack(track)
    }
    
    private func updatePendingCount() {
        pendingUploads = pendingEntries.count + pendingTracks.count
    }
}
