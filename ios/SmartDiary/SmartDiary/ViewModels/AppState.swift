import Foundation
import Combine

/// Main application state manager
class AppState: ObservableObject {
    // MARK: - Published Properties
    
    @Published var isLoggedIn: Bool = false
    @Published var currentUser: User?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // MARK: - Settings
    
    @Published var settings: AppSettings = AppSettings()
    
    // MARK: - Services
    
    let apiService: APIService
    let locationService: LocationService
    let syncService: SyncService
    
    // MARK: - Initialization
    
    init() {
        self.apiService = APIService()
        self.locationService = LocationService()
        self.syncService = SyncService()
        
        loadSettings()
    }
    
    // MARK: - Methods
    
    func loadSettings() {
        if let data = UserDefaults.standard.data(forKey: "appSettings"),
           let settings = try? JSONDecoder().decode(AppSettings.self, from: data) {
            self.settings = settings
        }
    }
    
    func saveSettings() {
        if let data = try? JSONEncoder().encode(settings) {
            UserDefaults.standard.set(data, forKey: "appSettings")
        }
    }
}

/// Application settings
struct AppSettings: Codable {
    var apiBaseURL: String = "http://localhost:8000"
    
    // Privacy settings
    var enableLocationTracking: Bool = true
    var enablePhotoAssignment: Bool = true
    var enableActivityDetection: Bool = true
    var enableHealthKit: Bool = false
    var enableWeather: Bool = true
    
    // AI settings
    var enableAI: Bool = true
    var guideMode: GuideMode = .minimal
    
    enum GuideMode: String, Codable, CaseIterable {
        case off = "Aus"
        case minimal = "Minimal"
        case verbose = "Gesprächig"
    }
}
