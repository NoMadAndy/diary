import Foundation
import Photos
import CoreLocation

/// Service for accessing and managing photos
class PhotoService: NSObject, ObservableObject {
    @Published var authorizationStatus: PHAuthorizationStatus = .notDetermined
    @Published var selectedPhotos: [PHAsset] = []
    
    override init() {
        super.init()
        authorizationStatus = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() async -> PHAuthorizationStatus {
        let status = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        await MainActor.run {
            self.authorizationStatus = status
        }
        return status
    }
    
    // MARK: - Fetch Photos
    
    /// Fetch photos taken within a time range and optionally within a location radius
    func fetchPhotos(
        from startDate: Date,
        to endDate: Date,
        location: CLLocation? = nil,
        radiusMeters: Double = 1000
    ) -> [PHAsset] {
        guard authorizationStatus == .authorized || authorizationStatus == .limited else {
            return []
        }
        
        let options = PHFetchOptions()
        
        // Filter by date
        options.predicate = NSPredicate(
            format: "creationDate >= %@ AND creationDate <= %@",
            startDate as NSDate,
            endDate as NSDate
        )
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: true)]
        
        let results = PHAsset.fetchAssets(with: .image, options: options)
        
        var assets: [PHAsset] = []
        results.enumerateObjects { asset, _, _ in
            // Filter by location if provided
            if let location = location, let assetLocation = asset.location {
                let distance = location.distance(from: assetLocation)
                if distance <= radiusMeters {
                    assets.append(asset)
                }
            } else if location == nil {
                assets.append(asset)
            }
        }
        
        return assets
    }
    
    /// Fetch photos matching track points (time and location based)
    func fetchPhotosForTrack(trackPoints: [CLLocation], bufferMinutes: Int = 30, radiusMeters: Double = 1000) -> [PHAsset] {
        guard !trackPoints.isEmpty else { return [] }
        guard let startTime = trackPoints.first?.timestamp,
              let endTime = trackPoints.last?.timestamp else { return [] }
        
        // Add buffer time before and after track
        let startDate = startTime.addingTimeInterval(TimeInterval(-bufferMinutes * 60))
        let endDate = endTime.addingTimeInterval(TimeInterval(bufferMinutes * 60))
        
        let options = PHFetchOptions()
        options.predicate = NSPredicate(
            format: "creationDate >= %@ AND creationDate <= %@",
            startDate as NSDate,
            endDate as NSDate
        )
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: true)]
        
        let results = PHAsset.fetchAssets(with: .image, options: options)
        
        var assets: [PHAsset] = []
        results.enumerateObjects { asset, _, _ in
            guard let assetLocation = asset.location else { return }
            
            // Check if photo is near any track point
            for trackPoint in trackPoints {
                let distance = trackPoint.distance(from: assetLocation)
                if distance <= radiusMeters {
                    assets.append(asset)
                    break
                }
            }
        }
        
        return assets
    }
    
    /// Get metadata for a photo asset
    func getPhotoMetadata(for asset: PHAsset) -> PhotoMetadata {
        return PhotoMetadata(
            localIdentifier: asset.localIdentifier,
            creationDate: asset.creationDate,
            location: asset.location,
            width: asset.pixelWidth,
            height: asset.pixelHeight,
            isFavorite: asset.isFavorite
        )
    }
    
    /// Load image data from asset
    func loadImageData(for asset: PHAsset, targetSize: CGSize = PHImageManagerMaximumSize) async -> Data? {
        return await withCheckedContinuation { continuation in
            let options = PHImageRequestOptions()
            options.isSynchronous = false
            options.deliveryMode = .highQualityFormat
            options.isNetworkAccessAllowed = true
            
            PHImageManager.default().requestImageDataAndOrientation(for: asset, options: options) { data, _, _, _ in
                continuation.resume(returning: data)
            }
        }
    }
}

// MARK: - Supporting Types

struct PhotoMetadata: Codable, Identifiable {
    var id: String { localIdentifier }
    let localIdentifier: String
    let creationDate: Date?
    let location: CLLocation?
    let width: Int
    let height: Int
    let isFavorite: Bool
    
    enum CodingKeys: String, CodingKey {
        case localIdentifier = "local_identifier"
        case creationDate = "creation_date"
        case location
        case width
        case height
        case isFavorite = "is_favorite"
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(localIdentifier, forKey: .localIdentifier)
        try container.encodeIfPresent(creationDate, forKey: .creationDate)
        try container.encode(width, forKey: .width)
        try container.encode(height, forKey: .height)
        try container.encode(isFavorite, forKey: .isFavorite)
        
        // Encode location as dict
        if let location = location {
            try container.encode([
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "altitude": location.altitude
            ], forKey: .location)
        }
    }
}
