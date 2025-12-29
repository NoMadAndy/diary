# SmartDiary iOS App

SwiftUI-based iOS app for SmartDiary.

## Features

- **Auto-Logging**: Automatic GPS tracking, photo assignment, activity detection
- **Manual Logging**: "Moment festhalten" for quick entries with photos, notes, and tags
- **KI-Reiseführer**: AI-powered travel guide with POI information
- **Sync**: Robust offline-first sync with the backend
- **Privacy**: Granular opt-in controls for each data source

## Requirements

- iOS 16.0+
- Xcode 15.0+
- Swift 5.9+

## Setup

1. Open `SmartDiary.xcodeproj` in Xcode
2. Configure your development team
3. Update the API base URL in Settings
4. Build and run

## Permissions

The app requests the following permissions (all with clear user explanations):

- **Location (Always)**: For tracking trips and auto-logging
- **Photos**: To access and assign photos to entries
- **Motion & Fitness**: For activity detection (walking, cycling, etc.)
- **HealthKit** (optional): For additional activity data

## Architecture

- **MVVM**: Model-View-ViewModel pattern
- **SwiftUI**: Modern declarative UI
- **Combine**: Reactive data flow
- **CoreData**: Local persistence
- **CoreLocation**: GPS tracking
- **PhotoKit**: Media access
