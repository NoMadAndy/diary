import SwiftUI

/// View for displaying daily and multi-day summaries
struct SummaryView: View {
    @EnvironmentObject var appState: AppState
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var selectedPeriod: Period = .today
    @State private var daySummary: DaySummaryResponse?
    @State private var multiDaySummary: MultiDaySummaryResponse?
    @State private var associatedPhotos: [PhotoMetadata] = []
    
    enum Period: String, CaseIterable {
        case today = "Heute"
        case lastWeek = "Letzte Woche"
        case lastMonth = "Letzter Monat"
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Period selector
                    Picker("Zeitraum", selection: $selectedPeriod) {
                        ForEach(Period.allCases, id: \.self) { period in
                            Text(period.rawValue).tag(period)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    .onChange(of: selectedPeriod) { _, _ in
                        loadSummary()
                    }
                    
                    if isLoading {
                        ProgressView("Lade Zusammenfassung...")
                            .padding()
                    } else if let error = errorMessage {
                        VStack(spacing: 12) {
                            Image(systemName: "exclamationmark.triangle")
                                .font(.largeTitle)
                                .foregroundColor(.orange)
                            Text(error)
                                .multilineTextAlignment(.center)
                            Button("Erneut versuchen") {
                                loadSummary()
                            }
                        }
                        .padding()
                    } else if selectedPeriod == .today, let summary = daySummary {
                        DaySummaryCard(summary: summary, photos: associatedPhotos)
                    } else if let summary = multiDaySummary {
                        MultiDaySummaryCard(summary: summary, photos: associatedPhotos)
                    }
                }
                .padding(.vertical)
            }
            .background(Color.gray.opacity(0.05))
            .navigationTitle("Zusammenfassungen")
            .onAppear {
                loadSummary()
            }
        }
    }
    
    private func loadSummary() {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                if selectedPeriod == .today {
                    // Load today's summary
                    let summary = try await appState.apiService.summarizeDay(date: Date())
                    
                    // Load associated photos
                    let startOfDay = Calendar.current.startOfDay(for: Date())
                    let endOfDay = Calendar.current.date(byAdding: .day, value: 1, to: startOfDay) ?? Date()
                    let photos = appState.photoService.fetchPhotos(from: startOfDay, to: endOfDay)
                    
                    await MainActor.run {
                        self.daySummary = summary
                        self.associatedPhotos = photos.map { appState.photoService.getPhotoMetadata(for: $0) }
                        self.isLoading = false
                    }
                } else {
                    // Load multi-day summary
                    let daysBack: Int
                    switch selectedPeriod {
                    case .today:
                        daysBack = 0
                    case .lastWeek:
                        daysBack = 7
                    case .lastMonth:
                        daysBack = 30
                    }
                    
                    let endDate = Date()
                    let startDate = Calendar.current.date(byAdding: .day, value: -daysBack, to: endDate) ?? Date()
                    
                    let summary = try await appState.apiService.summarizeMultipleDays(startDate: startDate, endDate: endDate)
                    
                    // Load associated photos
                    let photos = appState.photoService.fetchPhotos(from: startDate, to: endDate)
                    
                    await MainActor.run {
                        self.multiDaySummary = summary
                        self.associatedPhotos = photos.map { appState.photoService.getPhotoMetadata(for: $0) }
                        self.isLoading = false
                    }
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

// MARK: - Day Summary Card

struct DaySummaryCard: View {
    let summary: DaySummaryResponse
    let photos: [PhotoMetadata]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading) {
                    Text(summary.date)
                        .font(.title2)
                        .fontWeight(.bold)
                    if let title = summary.suggestedTitle {
                        Text(title)
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                }
                Spacer()
            }
            .padding(.horizontal)
            
            // Summary text
            Text(summary.summary)
                .font(.body)
                .padding(.horizontal)
            
            // Highlights
            if !summary.highlights.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Highlights")
                        .font(.headline)
                    ForEach(summary.highlights, id: \.self) { highlight in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                            Text(highlight)
                                .font(.subheadline)
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            // Statistics
            if let entries = summary.statistics["entries"] as? Int {
                HStack(spacing: 20) {
                    StatCard(icon: "text.bubble", value: "\(entries)", label: "Einträge")
                    if let tracks = summary.statistics["tracks"] as? Int, tracks > 0 {
                        StatCard(icon: "map", value: "\(tracks)", label: "Tracks")
                    }
                }
                .padding(.horizontal)
            }
            
            // Photos preview
            if !photos.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Fotos (\(photos.count))")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(photos.prefix(10)) { photo in
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 80, height: 80)
                                    .overlay(
                                        Image(systemName: "photo")
                                            .foregroundColor(.white)
                                    )
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            
            // Suggested tags
            if let tags = summary.suggestedTags, !tags.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Vorgeschlagene Tags")
                        .font(.headline)
                    FlowLayout(spacing: 8) {
                        ForEach(tags, id: \.self) { tag in
                            Text("#\(tag)")
                                .font(.caption)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(12)
                        }
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.vertical)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(radius: 2)
        .padding(.horizontal)
    }
}

// MARK: - Multi-Day Summary Card

struct MultiDaySummaryCard: View {
    let summary: MultiDaySummaryResponse
    let photos: [PhotoMetadata]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            VStack(alignment: .leading, spacing: 4) {
                Text("\(summary.startDate) - \(summary.endDate)")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("\(summary.totalStatistics.daysCount) Tage")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal)
            
            // Overall summary
            Text(summary.summary)
                .font(.body)
                .padding(.horizontal)
            
            // Statistics
            HStack(spacing: 16) {
                if summary.totalStatistics.totalEntries > 0 {
                    StatCard(icon: "text.bubble", value: "\(summary.totalStatistics.totalEntries)", label: "Einträge")
                }
                if let distance = summary.totalStatistics.totalDistance, distance > 0 {
                    StatCard(icon: "figure.walk", value: String(format: "%.1f km", distance / 1000), label: "Strecke")
                }
                if let elevation = summary.totalStatistics.totalElevationGain, elevation > 0 {
                    StatCard(icon: "arrow.up.right", value: String(format: "%.0f m", elevation), label: "Höhenmeter")
                }
            }
            .padding(.horizontal)
            
            // Highlights
            if !summary.highlights.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Highlights")
                        .font(.headline)
                    ForEach(summary.highlights, id: \.self) { highlight in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "star.fill")
                                .foregroundColor(.yellow)
                                .font(.caption)
                            Text(highlight)
                                .font(.subheadline)
                        }
                    }
                }
                .padding(.horizontal)
            }
            
            // Tracks summary
            if let tracks = summary.tracks, !tracks.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Aufgezeichnete Tracks")
                        .font(.headline)
                    ForEach(tracks, id: \.id) { track in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(track.name ?? "Track \(track.id)")
                                    .font(.subheadline)
                                Text(track.date)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            if let distance = track.distanceMeters {
                                Text(String(format: "%.1f km", distance / 1000))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(12)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                    }
                }
                .padding(.horizontal)
            }
            
            // Photos preview
            if !photos.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Fotos (\(photos.count))")
                        .font(.headline)
                        .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(photos.prefix(10)) { photo in
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 80, height: 80)
                                    .overlay(
                                        Image(systemName: "photo")
                                            .foregroundColor(.white)
                                    )
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
        }
        .padding(.vertical)
        .background(Color.white)
        .cornerRadius(16)
        .shadow(radius: 2)
        .padding(.horizontal)
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let icon: String
    let value: String
    let label: String
    
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
            Text(value)
                .font(.headline)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(minWidth: 80)
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x, y: bounds.minY + result.positions[index].y), proposal: .unspecified)
        }
    }
    
    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []
        
        init(in width: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var x: CGFloat = 0
            var y: CGFloat = 0
            var lineHeight: CGFloat = 0
            
            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)
                
                if x + size.width > width {
                    x = 0
                    y += lineHeight + spacing
                    lineHeight = 0
                }
                
                positions.append(CGPoint(x: x, y: y))
                x += size.width + spacing
                lineHeight = max(lineHeight, size.height)
            }
            
            self.size = CGSize(width: width, height: y + lineHeight)
        }
    }
}

#Preview {
    SummaryView()
        .environmentObject(AppState())
}
