import SwiftUI

/// View showing the changelog/what's new
struct ChangelogView: View {
    @EnvironmentObject var appState: AppState
    @State private var changelog: ChangelogResponse?
    @State private var isLoading = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView("Lade Changelog...")
                } else if let error = errorMessage {
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundColor(.orange)
                        Text(error)
                            .foregroundColor(.secondary)
                        Button("Erneut versuchen") {
                            Task { await loadChangelog() }
                        }
                    }
                } else if let changelog = changelog {
                    List {
                        ForEach(changelog.versions, id: \.version) { version in
                            Section {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Text("Version \(version.version)")
                                            .font(.headline)
                                        Spacer()
                                        if let date = version.date {
                                            Text(date)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                        }
                                    }
                                    
                                    if !version.added.isEmpty {
                                        ChangelogSection(title: "➕ Neu", items: version.added, color: .green)
                                    }
                                    
                                    if !version.changed.isEmpty {
                                        ChangelogSection(title: "🔄 Geändert", items: version.changed, color: .blue)
                                    }
                                    
                                    if !version.fixed.isEmpty {
                                        ChangelogSection(title: "🐛 Behoben", items: version.fixed, color: .orange)
                                    }
                                    
                                    if !version.security.isEmpty {
                                        ChangelogSection(title: "🔒 Sicherheit", items: version.security, color: .red)
                                    }
                                }
                            }
                        }
                    }
                    .refreshable {
                        await loadChangelog()
                    }
                } else {
                    Text("Keine Änderungen verfügbar")
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Was ist neu?")
        }
        .task {
            await loadChangelog()
        }
    }
    
    private func loadChangelog() async {
        isLoading = true
        errorMessage = nil
        
        do {
            changelog = try await appState.apiService.getChangelog()
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}

struct ChangelogSection: View {
    let title: String
    let items: [String]
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(color)
            
            ForEach(items, id: \.self) { item in
                HStack(alignment: .top) {
                    Text("•")
                        .foregroundColor(.secondary)
                    Text(item)
                        .font(.caption)
                }
            }
        }
    }
}

#Preview {
    ChangelogView()
        .environmentObject(AppState())
}
