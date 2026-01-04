import Foundation

/// API Service for communicating with the SmartDiary backend
class APIService: ObservableObject {
    private let baseURL: String
    private var accessToken: String?
    private var refreshToken: String?
    
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }()
    
    private let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }()
    
    init(baseURL: String = "http://localhost:8000") {
        self.baseURL = baseURL
    }
    
    // MARK: - Auth
    
    func login(email: String, password: String) async throws -> AuthResponse {
        let body = ["email": email, "password": password]
        let response: AuthResponse = try await post("/api/v1/auth/login", body: body)
        self.accessToken = response.accessToken
        self.refreshToken = response.refreshToken
        return response
    }
    
    func register(email: String, password: String, fullName: String?) async throws -> User {
        var body: [String: String] = ["email": email, "password": password]
        if let fullName = fullName {
            body["full_name"] = fullName
        }
        return try await post("/api/v1/auth/register", body: body)
    }
    
    func refreshTokens() async throws {
        guard let refreshToken = refreshToken else {
            throw APIError.unauthorized
        }
        let body = ["refresh_token": refreshToken]
        let response: AuthResponse = try await post("/api/v1/auth/refresh", body: body)
        self.accessToken = response.accessToken
        self.refreshToken = response.refreshToken
    }
    
    // MARK: - Entries
    
    func getEntries(page: Int = 1, pageSize: Int = 20) async throws -> PaginatedResponse<Entry> {
        return try await get("/api/v1/entries?page=\(page)&page_size=\(pageSize)")
    }
    
    func createEntry(_ entry: CreateEntryRequest) async throws -> Entry {
        return try await post("/api/v1/entries", body: entry)
    }
    
    func getEntry(id: Int) async throws -> Entry {
        return try await get("/api/v1/entries/\(id)")
    }
    
    func updateEntry(id: Int, _ update: UpdateEntryRequest) async throws -> Entry {
        return try await put("/api/v1/entries/\(id)", body: update)
    }
    
    func deleteEntry(id: Int) async throws {
        try await delete("/api/v1/entries/\(id)")
    }
    
    // MARK: - Changelog
    
    func getChangelog() async throws -> ChangelogResponse {
        return try await get("/api/v1/meta/changelog")
    }
    
    // MARK: - Tracks
    
    func createTrack(_ track: CreateTrackRequest) async throws -> Track {
        return try await post("/api/v1/tracks", body: track)
    }
    
    func getTracks(page: Int = 1, pageSize: Int = 20) async throws -> PaginatedResponse<Track> {
        return try await get("/api/v1/tracks?page=\(page)&page_size=\(pageSize)")
    }
    
    func getTrack(id: Int) async throws -> Track {
        return try await get("/api/v1/tracks/\(id)")
    }
    
    func getTrackStats(id: Int) async throws -> TrackStats {
        return try await get("/api/v1/tracks/\(id)/stats")
    }
    
    // MARK: - AI
    
    func getGuidePOI(latitude: Double, longitude: Double, mode: String) async throws -> GuidePOIResponse {
        let body = ["latitude": latitude, "longitude": longitude, "mode": mode] as [String : Any]
        return try await post("/api/v1/ai/guide/next", body: body)
    }
    
    func summarizeDay(date: Date) async throws -> DaySummaryResponse {
        let body = ["date": ISO8601DateFormatter().string(from: date)]
        return try await post("/api/v1/ai/summarize_day", body: body)
    }
    
    func summarizeMultipleDays(startDate: Date, endDate: Date) async throws -> MultiDaySummaryResponse {
        let body = [
            "start_date": ISO8601DateFormatter().string(from: startDate),
            "end_date": ISO8601DateFormatter().string(from: endDate)
        ]
        return try await post("/api/v1/ai/summarize_period", body: body)
    }
    
    func suggestActivities(latitude: Double, longitude: Double, interests: [String]? = nil) async throws -> ActivitySuggestionsResponse {
        var body: [String: Any] = ["latitude": latitude, "longitude": longitude]
        if let interests = interests {
            body["interests"] = interests
        }
        return try await post("/api/v1/ai/suggest_activities", body: body)
    }
    
    // MARK: - Private Methods
    
    private func get<T: Decodable>(_ endpoint: String) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        addAuthHeader(to: &request)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateResponse(response)
        
        return try decoder.decode(T.self, from: data)
    }
    
    private func post<T: Decodable, B: Encodable>(_ endpoint: String, body: B) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(to: &request)
        request.httpBody = try encoder.encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateResponse(response)
        
        return try decoder.decode(T.self, from: data)
    }
    
    private func post<T: Decodable>(_ endpoint: String, body: [String: Any]) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(to: &request)
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateResponse(response)
        
        return try decoder.decode(T.self, from: data)
    }
    
    private func put<T: Decodable, B: Encodable>(_ endpoint: String, body: B) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        addAuthHeader(to: &request)
        request.httpBody = try encoder.encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        try validateResponse(response)
        
        return try decoder.decode(T.self, from: data)
    }
    
    private func delete(_ endpoint: String) async throws {
        guard let url = URL(string: baseURL + endpoint) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        addAuthHeader(to: &request)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        try validateResponse(response)
    }
    
    private func addAuthHeader(to request: inout URLRequest) {
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }
    
    private func validateResponse(_ response: URLResponse) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        default:
            throw APIError.serverError(httpResponse.statusCode)
        }
    }
}

// MARK: - Supporting Types

struct AuthResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let tokenType: String
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case tokenType = "token_type"
    }
}

struct PaginatedResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let page: Int
    let pageSize: Int
    
    enum CodingKeys: String, CodingKey {
        case items
        case total
        case page
        case pageSize = "page_size"
    }
}

struct CreateEntryRequest: Codable {
    var title: String?
    var content: String?
    var latitude: Double?
    var longitude: Double?
    var locationName: String?
    var mood: String?
    var rating: Int?
    var tags: [String]?
    var weather: [String: String]?
    var activity: String?
    var entryDate: Date?
    
    enum CodingKeys: String, CodingKey {
        case title
        case content
        case latitude
        case longitude
        case locationName = "location_name"
        case mood
        case rating
        case tags
        case weather
        case activity
        case entryDate = "entry_date"
    }
}

struct UpdateEntryRequest: Codable {
    var title: String?
    var content: String?
    var latitude: Double?
    var longitude: Double?
    var locationName: String?
    var mood: String?
    var rating: Int?
    var tags: [String]?
    var weather: [String: String]?
    var activity: String?
    
    enum CodingKeys: String, CodingKey {
        case title
        case content
        case latitude
        case longitude
        case locationName = "location_name"
        case mood
        case rating
        case tags
        case weather
        case activity
    }
}

struct CreateTrackRequest: Codable {
    struct TrackPoint: Codable {
        let latitude: Double
        let longitude: Double
        let elevation: Double?
        let timestamp: String?
    }
    
    let name: String?
    let description: String?
    let entryId: Int?
    let trackData: [TrackPoint]
    let startedAt: String?
    let endedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case name
        case description
        case entryId = "entry_id"
        case trackData = "track_data"
        case startedAt = "started_at"
        case endedAt = "ended_at"
    }
}

struct TrackStats: Codable {
    let distanceMeters: Double?
    let durationSeconds: Int?
    let elevationGain: Double?
    let elevationLoss: Double?
    let maxElevation: Double?
    let minElevation: Double?
    let avgSpeed: Double?
    
    enum CodingKeys: String, CodingKey {
        case distanceMeters = "distance_meters"
        case durationSeconds = "duration_seconds"
        case elevationGain = "elevation_gain"
        case elevationLoss = "elevation_loss"
        case maxElevation = "max_elevation"
        case minElevation = "min_elevation"
        case avgSpeed = "avg_speed"
    }
}

struct GuidePOIResponse: Codable {
    let poiName: String?
    let text: String
    let hasMore: Bool
    let distanceMeters: Double?
    
    enum CodingKeys: String, CodingKey {
        case poiName = "poi_name"
        case text
        case hasMore = "has_more"
        case distanceMeters = "distance_meters"
    }
}

struct DaySummaryResponse: Codable {
    let date: String
    let summary: String
    let highlights: [String]
    let statistics: [String: Int]
    let suggestedTitle: String?
    let suggestedTags: [String]?
    
    enum CodingKeys: String, CodingKey {
        case date
        case summary
        case highlights
        case statistics
        case suggestedTitle = "suggested_title"
        case suggestedTags = "suggested_tags"
    }
}

struct MultiDaySummaryResponse: Codable {
    let startDate: String
    let endDate: String
    let summary: String
    let dailySummaries: [DaySummaryResponse]
    let totalStatistics: MultiDayStatistics
    let highlights: [String]
    let photos: [String]?
    let tracks: [TrackSummary]?
    
    enum CodingKeys: String, CodingKey {
        case startDate = "start_date"
        case endDate = "end_date"
        case summary
        case dailySummaries = "daily_summaries"
        case totalStatistics = "total_statistics"
        case highlights
        case photos
        case tracks
    }
}

struct MultiDayStatistics: Codable {
    let totalEntries: Int
    let totalDistance: Double?
    let totalElevationGain: Double?
    let totalDuration: Int?
    let daysCount: Int
    
    enum CodingKeys: String, CodingKey {
        case totalEntries = "total_entries"
        case totalDistance = "total_distance"
        case totalElevationGain = "total_elevation_gain"
        case totalDuration = "total_duration"
        case daysCount = "days_count"
    }
}

struct TrackSummary: Codable {
    let id: Int
    let name: String?
    let date: String
    let distanceMeters: Double?
    let elevationGain: Double?
}

struct ActivitySuggestionsResponse: Codable {
    let location: String
    let activities: [ActivitySuggestion]
    let guidedTour: GuidedTour?
    
    enum CodingKeys: String, CodingKey {
        case location
        case activities
        case guidedTour = "guided_tour"
    }
}

struct ActivitySuggestion: Codable {
    let name: String
    let description: String
    let category: String
    let estimatedDuration: Int?
    let recommendationReason: String
    
    enum CodingKeys: String, CodingKey {
        case name
        case description
        case category
        case estimatedDuration = "estimated_duration"
        case recommendationReason = "recommendation_reason"
    }
}

struct GuidedTour: Codable {
    let name: String
    let description: String
    let duration: Int
    let stops: [TourStop]
}

struct TourStop: Codable {
    let name: String
    let description: String
    let latitude: Double
    let longitude: Double
    let order: Int
}

enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case notFound
    case serverError(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Ungültige URL"
        case .invalidResponse:
            return "Ungültige Serverantwort"
        case .unauthorized:
            return "Nicht autorisiert"
        case .notFound:
            return "Nicht gefunden"
        case .serverError(let code):
            return "Serverfehler (\(code))"
        }
    }
}
