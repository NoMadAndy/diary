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
    
    // MARK: - AI
    
    func getGuidePOI(latitude: Double, longitude: Double, mode: String) async throws -> GuidePOIResponse {
        let body = ["latitude": latitude, "longitude": longitude, "mode": mode] as [String : Any]
        return try await post("/api/v1/ai/guide/next", body: body)
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
