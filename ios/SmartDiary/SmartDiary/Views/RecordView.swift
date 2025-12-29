import SwiftUI

/// View for recording new entries
struct RecordView: View {
    @EnvironmentObject var appState: AppState
    @State private var content: String = ""
    @State private var selectedMood: String?
    @State private var tags: String = ""
    @State private var isTracking = false
    @State private var showingImagePicker = false
    @State private var selectedImage: UIImage?
    @State private var isSaving = false
    @State private var showingSaveSuccess = false
    
    let moods = ["😊 Glücklich", "😢 Traurig", "🤩 Aufgeregt", "😌 Ruhig", "😴 Müde", "😐 Neutral"]
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Quick capture
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Moment festhalten", systemImage: "sparkles")
                            .font(.headline)
                        
                        TextEditor(text: $content)
                            .frame(minHeight: 100)
                            .padding(8)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(12)
                        
                        // Photo button
                        Button {
                            showingImagePicker = true
                        } label: {
                            HStack {
                                Image(systemName: "photo.on.rectangle")
                                Text(selectedImage != nil ? "Foto ändern" : "Foto hinzufügen")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(12)
                        }
                        
                        if let image = selectedImage {
                            Image(uiImage: image)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(maxHeight: 200)
                                .cornerRadius(12)
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(radius: 2)
                    
                    // Mood selection
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Stimmung", systemImage: "face.smiling")
                            .font(.headline)
                        
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 100))], spacing: 8) {
                            ForEach(moods, id: \.self) { mood in
                                Button {
                                    selectedMood = mood
                                } label: {
                                    Text(mood)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(selectedMood == mood ? Color.blue : Color.gray.opacity(0.1))
                                        .foregroundColor(selectedMood == mood ? .white : .primary)
                                        .cornerRadius(20)
                                }
                            }
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(radius: 2)
                    
                    // Tags
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Tags", systemImage: "tag")
                            .font(.headline)
                        
                        TextField("z.B. Reise, Familie, Natur", text: $tags)
                            .textFieldStyle(.roundedBorder)
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(radius: 2)
                    
                    // Track recording
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Track aufnehmen", systemImage: "location.circle")
                            .font(.headline)
                        
                        Button {
                            toggleTracking()
                        } label: {
                            HStack {
                                Image(systemName: isTracking ? "stop.circle.fill" : "play.circle.fill")
                                Text(isTracking ? "Track beenden" : "Track starten")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(isTracking ? Color.red : Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        if isTracking {
                            Text("📍 Track läuft...")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                    .padding()
                    .background(Color.white)
                    .cornerRadius(16)
                    .shadow(radius: 2)
                    
                    // Save button
                    Button {
                        saveEntry()
                    } label: {
                        HStack {
                            if isSaving {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Image(systemName: "checkmark.circle.fill")
                            }
                            Text("Speichern")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isSaving || content.isEmpty)
                }
                .padding()
            }
            .background(Color.gray.opacity(0.05))
            .navigationTitle("Aufnehmen")
            .alert("Gespeichert!", isPresented: $showingSaveSuccess) {
                Button("OK") {
                    resetForm()
                }
            } message: {
                Text("Dein Moment wurde erfolgreich gespeichert.")
            }
        }
    }
    
    private func toggleTracking() {
        if isTracking {
            let _ = appState.locationService.stopTracking()
            isTracking = false
        } else {
            appState.locationService.startTracking()
            isTracking = true
        }
    }
    
    private func saveEntry() {
        isSaving = true
        
        let tagsList = tags.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) }
        let mood = selectedMood?.split(separator: " ").last.map { String($0) }
        
        let entry = CreateEntryRequest(
            content: content,
            latitude: appState.locationService.currentLocation?.coordinate.latitude,
            longitude: appState.locationService.currentLocation?.coordinate.longitude,
            mood: mood,
            tags: tagsList.isEmpty ? nil : tagsList,
            entryDate: Date()
        )
        
        appState.syncService.addPendingEntry(entry)
        
        Task {
            await appState.syncService.sync()
            await MainActor.run {
                isSaving = false
                showingSaveSuccess = true
            }
        }
    }
    
    private func resetForm() {
        content = ""
        selectedMood = nil
        tags = ""
        selectedImage = nil
    }
}

#Preview {
    RecordView()
        .environmentObject(AppState())
}
