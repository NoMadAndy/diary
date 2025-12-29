import SwiftUI

/// Main timeline view showing recent entries
struct TimelineView: View {
    @EnvironmentObject var appState: AppState
    @State private var entries: [Entry] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Lade Einträge...")
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .foregroundColor(.secondary)
                        Button("Erneut versuchen") {
                            Task { await loadEntries() }
                        }
                    }
                } else if entries.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)
                        Text("Noch keine Einträge")
                            .font(.headline)
                        Text("Tippe auf '+' um deinen ersten Moment festzuhalten.")
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                } else {
                    List(entries) { entry in
                        EntryRowView(entry: entry)
                    }
                    .refreshable {
                        await loadEntries()
                    }
                }
            }
            .navigationTitle("Timeline")
        }
        .task {
            await loadEntries()
        }
    }
    
    private func loadEntries() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response = try await appState.apiService.getEntries()
            entries = response.items
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}

/// Single entry row in the timeline
struct EntryRowView: View {
    let entry: Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                if let title = entry.title, !title.isEmpty {
                    Text(title)
                        .font(.headline)
                } else {
                    Text(entry.entryDate, style: .date)
                        .font(.headline)
                }
                Spacer()
                if let mood = entry.mood {
                    Text(moodEmoji(mood))
                }
            }
            
            if let content = entry.content, !content.isEmpty {
                Text(content)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            if let location = entry.locationName {
                HStack {
                    Image(systemName: "location")
                        .font(.caption)
                    Text(location)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            if !entry.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(entry.tags, id: \.self) { tag in
                            Text("#\(tag)")
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.blue.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private func moodEmoji(_ mood: String) -> String {
        switch mood.lowercased() {
        case "happy", "glücklich": return "😊"
        case "sad", "traurig": return "😢"
        case "excited", "aufgeregt": return "🤩"
        case "calm", "ruhig": return "😌"
        case "tired", "müde": return "😴"
        default: return "😐"
        }
    }
}

#Preview {
    TimelineView()
        .environmentObject(AppState())
}
