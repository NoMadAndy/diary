import Foundation

/// User model
struct User: Codable, Identifiable {
    let id: Int
    let email: String
    let fullName: String?
    let isActive: Bool
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case fullName = "full_name"
        case isActive = "is_active"
        case createdAt = "created_at"
    }
}

/// Diary entry model
struct Entry: Codable, Identifiable {
    let id: Int
    let userId: Int
    var title: String?
    var content: String?
    var latitude: Double?
    var longitude: Double?
    var locationName: String?
    var mood: String?
    var rating: Int?
    var tags: [String]
    var weather: [String: String]?
    var activity: String?
    var aiSummary: String?
    var aiTags: [String]?
    let entryDate: Date
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
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
        case aiSummary = "ai_summary"
        case aiTags = "ai_tags"
        case entryDate = "entry_date"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

/// Track model for GPS recordings
struct Track: Codable, Identifiable {
    let id: Int
    let userId: Int
    var entryId: Int?
    var name: String?
    var description: String?
    let trackData: [[String: Double]]
    var distanceMeters: Double?
    var durationSeconds: Int?
    var elevationGain: Double?
    var elevationLoss: Double?
    var maxElevation: Double?
    var minElevation: Double?
    var avgSpeed: Double?
    var startedAt: Date?
    var endedAt: Date?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case entryId = "entry_id"
        case name
        case description
        case trackData = "track_data"
        case distanceMeters = "distance_meters"
        case durationSeconds = "duration_seconds"
        case elevationGain = "elevation_gain"
        case elevationLoss = "elevation_loss"
        case maxElevation = "max_elevation"
        case minElevation = "min_elevation"
        case avgSpeed = "avg_speed"
        case startedAt = "started_at"
        case endedAt = "ended_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

/// Media file model
struct Media: Codable, Identifiable {
    let id: Int
    let userId: Int
    var entryId: Int?
    let filename: String
    let originalFilename: String?
    let mimeType: String
    let fileSize: Int?
    var latitude: Double?
    var longitude: Double?
    var capturedAt: Date?
    let createdAt: Date
    let updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case entryId = "entry_id"
        case filename
        case originalFilename = "original_filename"
        case mimeType = "mime_type"
        case fileSize = "file_size"
        case latitude
        case longitude
        case capturedAt = "captured_at"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

/// Changelog version model
struct ChangelogVersion: Codable {
    let version: String
    let date: String?
    let added: [String]
    let changed: [String]
    let fixed: [String]
    let security: [String]
}

/// Changelog response model
struct ChangelogResponse: Codable {
    let markdown: String
    let versions: [ChangelogVersion]
}
