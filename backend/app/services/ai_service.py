"""
AI service for OpenAI-powered features.
"""
from typing import List, Optional
from datetime import datetime
import json

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion

from app.core.config import settings
from app.schemas.ai import (
    DaySummaryResponse,
    TagSuggestionResponse,
    TripSuggestionResponse,
    GuidePOIResponse,
    POI,
)


class AIService:
    """Service for AI-powered features using OpenAI."""
    
    def __init__(self):
        self.client = None
        if settings.openai_api_key:
            self.client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def _chat_completion(
        self,
        messages: List[dict],
        max_tokens: int = None,
    ) -> Optional[str]:
        """Make a chat completion request."""
        if not self.client:
            return None
        
        try:
            response: ChatCompletion = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,
                max_tokens=max_tokens or settings.openai_max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API error: {e}")
            return None
    
    async def generate_day_summary(self, entries: List, tracks: List = None) -> DaySummaryResponse:
        """Generate a summary for a day's entries."""
        if not entries and not tracks:
            return DaySummaryResponse(
                date=datetime.utcnow().strftime("%Y-%m-%d"),
                summary="Keine Einträge für diesen Tag.",
                highlights=[],
                statistics={"entries": 0},
            )
        
        # Prepare entry data for AI
        entries_text = []
        for entry in entries:
            text = f"- "
            if entry.title:
                text += f"**{entry.title}**: "
            if entry.content:
                text += entry.content[:500]
            if entry.location_name:
                text += f" (Ort: {entry.location_name})"
            if entry.mood:
                text += f" [Stimmung: {entry.mood}]"
            if entry.tags:
                text += f" #{' #'.join(entry.tags)}"
            entries_text.append(text)
        
        # Add track information
        track_info = ""
        total_distance = 0
        total_elevation = 0
        if tracks:
            for track in tracks:
                if track.distance_meters:
                    total_distance += track.distance_meters
                if track.elevation_gain:
                    total_elevation += track.elevation_gain
            
            if total_distance > 0:
                track_info = f"\n\nAufgezeichnete Tracks:\n- Gesamtstrecke: {total_distance/1000:.2f} km"
            if total_elevation > 0:
                track_info += f"\n- Höhenmeter: {total_elevation:.0f} m"
        
        entries_combined = "\n".join(entries_text) + track_info
        date_str = entries[0].entry_date.strftime("%Y-%m-%d") if entries else datetime.utcnow().strftime("%Y-%m-%d")
        
        # Generate summary with AI
        prompt = f"""Erstelle eine kurze, persönliche Zusammenfassung für den Tag {date_str} basierend auf diesen Tagebucheinträgen:

{entries_combined}

Antworte im JSON-Format:
{{
    "summary": "Eine kurze, persönliche Geschichte des Tages (2-3 Sätze)",
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
    "suggested_title": "Ein passender Titel für den Tag",
    "suggested_tags": ["tag1", "tag2"]
}}"""

        response = await self._chat_completion([
            {"role": "system", "content": "Du bist ein freundlicher Assistent, der Tagebucheinträge zusammenfasst. Antworte immer auf Deutsch und im angegebenen JSON-Format."},
            {"role": "user", "content": prompt}
        ])
        
        # Parse response or use fallback
        if response:
            try:
                # Clean up response if it contains markdown code blocks
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0]
                
                data = json.loads(response.strip())
                return DaySummaryResponse(
                    date=date_str,
                    summary=data.get("summary", ""),
                    highlights=data.get("highlights", []),
                    statistics={"entries": len(entries), "tracks": len(tracks) if tracks else 0},
                    suggested_title=data.get("suggested_title"),
                    suggested_tags=data.get("suggested_tags"),
                )
            except json.JSONDecodeError:
                pass
        
        # Fallback without AI
        return DaySummaryResponse(
            date=date_str,
            summary=f"Ein Tag mit {len(entries)} Einträgen.",
            highlights=[entry.title or "Eintrag" for entry in entries[:3]],
            statistics={"entries": len(entries), "tracks": len(tracks) if tracks else 0},
        )
    
    async def suggest_tags(
        self,
        content: str,
        location: Optional[str] = None,
        activity: Optional[str] = None,
    ) -> TagSuggestionResponse:
        """Suggest tags for content."""
        context = f"Inhalt: {content[:1000]}"
        if location:
            context += f"\nOrt: {location}"
        if activity:
            context += f"\nAktivität: {activity}"
        
        prompt = f"""Schlage passende Tags für diesen Tagebucheintrag vor:

{context}

Antworte im JSON-Format:
{{
    "tags": ["tag1", "tag2", "tag3"],
    "categories": ["Kategorie1", "Kategorie2"],
    "confidence": 0.8
}}"""

        response = await self._chat_completion([
            {"role": "system", "content": "Du bist ein Assistent, der passende Tags für Tagebucheinträge vorschlägt. Antworte immer auf Deutsch und im angegebenen JSON-Format."},
            {"role": "user", "content": prompt}
        ], max_tokens=500)
        
        if response:
            try:
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0]
                
                data = json.loads(response.strip())
                return TagSuggestionResponse(
                    tags=data.get("tags", []),
                    categories=data.get("categories", []),
                    confidence=data.get("confidence", 0.5),
                )
            except json.JSONDecodeError:
                pass
        
        # Fallback
        return TagSuggestionResponse(tags=[], categories=[], confidence=0.0)
    
    async def suggest_trip(
        self,
        start_location: str,
        end_location: Optional[str] = None,
        interests: List[str] = None,
        time_budget_hours: Optional[float] = None,
        transport_mode: str = "driving",
    ) -> TripSuggestionResponse:
        """Generate a trip suggestion with POIs."""
        interests_str = ", ".join(interests) if interests else "Allgemein"
        
        prompt = f"""Erstelle einen Reisevorschlag:
- Start: {start_location}
- Ziel: {end_location or start_location + " (Rundtour)"}
- Interessen: {interests_str}
- Zeitbudget: {time_budget_hours or "flexibel"} Stunden
- Transportmittel: {transport_mode}

Antworte im JSON-Format:
{{
    "route_description": "Beschreibung der Route",
    "total_distance_km": 50.0,
    "total_duration_hours": 4.0,
    "pois": [
        {{
            "name": "Sehenswürdigkeit",
            "description": "Kurze Beschreibung",
            "latitude": 48.1351,
            "longitude": 11.5820,
            "category": "Kultur",
            "estimated_duration_minutes": 60,
            "rating": 4.5
        }}
    ],
    "reasoning": "Warum diese Route empfohlen wird"
}}"""

        response = await self._chat_completion([
            {"role": "system", "content": "Du bist ein erfahrener Reiseführer und Routenplaner. Erstelle detaillierte, praktische Reisevorschläge mit echten Sehenswürdigkeiten. Antworte auf Deutsch im angegebenen JSON-Format."},
            {"role": "user", "content": prompt}
        ])
        
        if response:
            try:
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0]
                
                data = json.loads(response.strip())
                pois = [POI(**poi) for poi in data.get("pois", [])]
                return TripSuggestionResponse(
                    route_description=data.get("route_description", ""),
                    total_distance_km=data.get("total_distance_km"),
                    total_duration_hours=data.get("total_duration_hours"),
                    pois=pois,
                    reasoning=data.get("reasoning", ""),
                )
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Fallback
        return TripSuggestionResponse(
            route_description=f"Route von {start_location} nach {end_location or start_location}",
            total_distance_km=None,
            total_duration_hours=None,
            pois=[],
            reasoning="KI-Vorschläge momentan nicht verfügbar.",
        )
    
    async def get_guide_poi(
        self,
        latitude: float,
        longitude: float,
        mode: str = "minimal",
    ) -> GuidePOIResponse:
        """Get POI information for guide mode."""
        prompt = f"""Beschreibe die wichtigste Sehenswürdigkeit in der Nähe von:
Latitude: {latitude}, Longitude: {longitude}

Modus: {"kurz (1-2 Sätze)" if mode == "minimal" else "ausführlich mit Hintergrund und Fun Facts"}

Antworte im JSON-Format:
{{
    "poi_name": "Name der Sehenswürdigkeit",
    "text": "Beschreibung",
    "has_more": true,
    "distance_meters": 100
}}"""

        response = await self._chat_completion([
            {"role": "system", "content": "Du bist ein Reiseführer, der interessante Informationen über Sehenswürdigkeiten gibt. Antworte auf Deutsch im angegebenen JSON-Format."},
            {"role": "user", "content": prompt}
        ], max_tokens=800)
        
        if response:
            try:
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0]
                
                data = json.loads(response.strip())
                return GuidePOIResponse(
                    poi_name=data.get("poi_name"),
                    text=data.get("text", ""),
                    has_more=data.get("has_more", False),
                    distance_meters=data.get("distance_meters"),
                )
            except json.JSONDecodeError:
                pass
        
        # Fallback
        return GuidePOIResponse(
            poi_name=None,
            text="Keine POI-Informationen verfügbar.",
            has_more=False,
        )
    
    async def generate_multi_day_summary(
        self,
        entries: List,
        tracks: List,
        start_date: datetime,
        end_date: datetime,
    ):
        """Generate a summary for multiple days."""
        from app.schemas.ai import (
            MultiDaySummaryResponse,
            MultiDayStatistics,
            TrackSummary,
            DaySummaryResponse,
        )
        
        if not entries and not tracks:
            return MultiDaySummaryResponse(
                start_date=start_date.strftime("%Y-%m-%d"),
                end_date=end_date.strftime("%Y-%m-%d"),
                summary="Keine Einträge für diesen Zeitraum.",
                daily_summaries=[],
                total_statistics=MultiDayStatistics(
                    total_entries=0,
                    total_distance=None,
                    total_elevation_gain=None,
                    total_duration=None,
                    days_count=0,
                ),
                highlights=[],
            )
        
        # Calculate statistics from tracks
        total_distance = sum(t.distance_meters or 0 for t in tracks) if tracks else 0
        total_elevation = sum(t.elevation_gain or 0 for t in tracks) if tracks else 0
        total_duration = sum(t.duration_seconds or 0 for t in tracks) if tracks else 0
        
        # Group entries by day
        from collections import defaultdict
        entries_by_day = defaultdict(list)
        for entry in entries:
            day_key = entry.entry_date.strftime("%Y-%m-%d")
            entries_by_day[day_key].append(entry)
        
        # Generate daily summaries
        daily_summaries = []
        for day_key in sorted(entries_by_day.keys()):
            day_entries = entries_by_day[day_key]
            day_tracks = [t for t in tracks if t.started_at and t.started_at.strftime("%Y-%m-%d") == day_key]
            day_summary = await self.generate_day_summary(day_entries, day_tracks)
            daily_summaries.append(day_summary)
        
        # Prepare context for overall summary
        context = f"""Zeitraum: {start_date.strftime("%Y-%m-%d")} bis {end_date.strftime("%Y-%m-%d")}
Anzahl Einträge: {len(entries)}
Anzahl Tracks: {len(tracks)}
Gesamtstrecke: {total_distance/1000:.2f} km
Gesamthöhenmeter: {total_elevation:.0f} m

Tägliche Zusammenfassungen:
"""
        for ds in daily_summaries[:5]:  # Limit to first 5 days
            context += f"\n{ds.date}: {ds.summary}"
        
        prompt = f"""Erstelle eine umfassende Zusammenfassung für diesen Zeitraum:

{context}

Antworte im JSON-Format:
{{
    "summary": "Eine ausführliche Zusammenfassung des gesamten Zeitraums (4-5 Sätze)",
    "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"]
}}"""
        
        response = await self._chat_completion([
            {"role": "system", "content": "Du bist ein freundlicher Assistent, der Tagebucheinträge zusammenfasst. Antworte immer auf Deutsch und im angegebenen JSON-Format."},
            {"role": "user", "content": prompt}
        ], max_tokens=1000)
        
        overall_summary = f"Zeitraum mit {len(entries)} Einträgen und {len(tracks)} Tracks."
        highlights = []
        
        if response:
            try:
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0]
                
                data = json.loads(response.strip())
                overall_summary = data.get("summary", overall_summary)
                highlights = data.get("highlights", [])
            except json.JSONDecodeError:
                pass
        
        # Create track summaries
        track_summaries = [
            TrackSummary(
                id=t.id,
                name=t.name,
                date=t.started_at.strftime("%Y-%m-%d") if t.started_at else "",
                distance_meters=t.distance_meters,
                elevation_gain=t.elevation_gain,
            )
            for t in tracks[:10]  # Limit to 10 tracks
        ]
        
        return MultiDaySummaryResponse(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            summary=overall_summary,
            daily_summaries=daily_summaries,
            total_statistics=MultiDayStatistics(
                total_entries=len(entries),
                total_distance=total_distance if total_distance > 0 else None,
                total_elevation_gain=total_elevation if total_elevation > 0 else None,
                total_duration=total_duration if total_duration > 0 else None,
                days_count=len(daily_summaries),
            ),
            highlights=highlights,
            tracks=track_summaries if track_summaries else None,
        )
    
    async def suggest_activities(
        self,
        latitude: float,
        longitude: float,
        interests: Optional[List[str]] = None,
    ):
        """Suggest activities at a destination with detailed research."""
        from app.schemas.ai import (
            ActivitySuggestionsResponse,
            ActivitySuggestion,
            GuidedTour,
            TourStop,
        )
        
        interests_str = ", ".join(interests) if interests else "Allgemein"
        
        prompt = f"""Du bist ein erfahrener Reiseführer. Recherchiere gründlich und erstelle detaillierte Vorschläge für Aktivitäten in der Nähe von:
Latitude: {latitude}, Longitude: {longitude}
Interessen: {interests_str}

Erstelle mindestens 3 konkrete Aktivitätsvorschläge und einen geführten Rundgang.

Antworte im JSON-Format:
{{
    "location": "Name des Ortes",
    "activities": [
        {{
            "name": "Name der Aktivität",
            "description": "Ausführliche Beschreibung (2-3 Sätze)",
            "category": "Kategorie (z.B. Kultur, Natur, Sport, Essen)",
            "estimated_duration": 120,
            "recommendation_reason": "Warum diese Aktivität empfohlen wird"
        }}
    ],
    "guided_tour": {{
        "name": "Name der geführten Tour",
        "description": "Beschreibung der Tour (2-3 Sätze)",
        "duration": 180,
        "stops": [
            {{
                "name": "Stopp 1",
                "description": "Beschreibung",
                "latitude": 48.1351,
                "longitude": 11.5820,
                "order": 1
            }}
        ]
    }}
}}

Erstelle bitte mindestens 3 verschiedene Aktivitäten und mindestens 3 Stopps für die Tour."""

        response = await self._chat_completion([
            {"role": "system", "content": "Du bist ein erfahrener Reiseführer mit umfangreichem Wissen über Sehenswürdigkeiten und Aktivitäten weltweit. Erstelle detaillierte, praktische Vorschläge mit echten Orten und Sehenswürdigkeiten. Antworte auf Deutsch im angegebenen JSON-Format."},
            {"role": "user", "content": prompt}
        ], max_tokens=2000)
        
        if response:
            try:
                if "```json" in response:
                    response = response.split("```json")[1].split("```")[0]
                elif "```" in response:
                    response = response.split("```")[1].split("```")[0]
                
                data = json.loads(response.strip())
                
                activities = [
                    ActivitySuggestion(**act) for act in data.get("activities", [])
                ]
                
                guided_tour = None
                if "guided_tour" in data and data["guided_tour"]:
                    tour_data = data["guided_tour"]
                    stops = [TourStop(**stop) for stop in tour_data.get("stops", [])]
                    guided_tour = GuidedTour(
                        name=tour_data.get("name", ""),
                        description=tour_data.get("description", ""),
                        duration=tour_data.get("duration", 0),
                        stops=stops,
                    )
                
                return ActivitySuggestionsResponse(
                    location=data.get("location", "Unbekannter Ort"),
                    activities=activities,
                    guided_tour=guided_tour,
                )
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error parsing activity suggestions: {e}")
        
        # Fallback
        return ActivitySuggestionsResponse(
            location="Standort",
            activities=[
                ActivitySuggestion(
                    name="Umgebung erkunden",
                    description="Erkunde die Umgebung zu Fuß und entdecke lokale Sehenswürdigkeiten.",
                    category="Allgemein",
                    estimated_duration=60,
                    recommendation_reason="Gute Möglichkeit, die Gegend kennenzulernen.",
                )
            ],
            guided_tour=None,
        )


# Singleton instance
ai_service = AIService()
