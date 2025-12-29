import SwiftUI

/// Settings view with privacy controls and app configuration
struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        NavigationStack {
            Form {
                // Connection
                Section("Verbindung") {
                    HStack {
                        Text("API URL")
                        Spacer()
                        TextField("URL", text: $appState.settings.apiBaseURL)
                            .textFieldStyle(.roundedBorder)
                            .frame(width: 200)
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                    }
                }
                
                // Privacy
                Section {
                    Toggle("Standortverfolgung", isOn: $appState.settings.enableLocationTracking)
                    Toggle("Fotozuordnung", isOn: $appState.settings.enablePhotoAssignment)
                    Toggle("Aktivitätserkennung", isOn: $appState.settings.enableActivityDetection)
                    Toggle("HealthKit", isOn: $appState.settings.enableHealthKit)
                    Toggle("Wetter", isOn: $appState.settings.enableWeather)
                } header: {
                    Text("Datenschutz")
                } footer: {
                    Text("Aktiviere nur die Datenquellen, die du nutzen möchtest. Alle Daten bleiben auf deinen Geräten und deinem eigenen Server.")
                }
                
                // AI Settings
                Section {
                    Toggle("KI-Funktionen aktivieren", isOn: $appState.settings.enableAI)
                    
                    if appState.settings.enableAI {
                        Picker("Reiseführer-Modus", selection: $appState.settings.guideMode) {
                            ForEach(AppSettings.GuideMode.allCases, id: \.self) { mode in
                                Text(mode.rawValue).tag(mode)
                            }
                        }
                    }
                } header: {
                    Text("KI-Funktionen")
                } footer: {
                    Text("KI-Funktionen nutzen OpenAI API. Wenn aktiviert, werden Textinhalte (ohne Fotos) an OpenAI gesendet.")
                }
                
                // Sync
                Section("Synchronisation") {
                    HStack {
                        Text("Ausstehende Uploads")
                        Spacer()
                        Text("\(appState.syncService.pendingUploads)")
                            .foregroundColor(.secondary)
                    }
                    
                    if let lastSync = appState.syncService.lastSyncDate {
                        HStack {
                            Text("Letzte Synchronisation")
                            Spacer()
                            Text(lastSync, style: .relative)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    Button {
                        Task {
                            await appState.syncService.sync()
                        }
                    } label: {
                        HStack {
                            Text("Jetzt synchronisieren")
                            if appState.syncService.isSyncing {
                                Spacer()
                                ProgressView()
                            }
                        }
                    }
                    .disabled(appState.syncService.isSyncing)
                }
                
                // About
                Section("Über") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("0.1.0")
                            .foregroundColor(.secondary)
                    }
                    
                    Link(destination: URL(string: "https://github.com/NoMadAndy/diary")!) {
                        HStack {
                            Text("Quellcode")
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                        }
                    }
                }
            }
            .navigationTitle("Einstellungen")
            .onChange(of: appState.settings) { oldValue, newValue in
                appState.saveSettings()
            }
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
}
