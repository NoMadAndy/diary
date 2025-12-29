"""
Track service for GPS track calculations.
"""
import math
from typing import List, Dict, Any
from datetime import datetime


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula (in meters)."""
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (
        math.sin(delta_lat / 2) ** 2 +
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def calculate_track_stats(track_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate statistics for a GPS track."""
    if not track_data or len(track_data) < 2:
        return {
            "distance_meters": 0,
            "duration_seconds": None,
            "elevation_gain": None,
            "elevation_loss": None,
            "max_elevation": None,
            "min_elevation": None,
            "avg_speed": None,
            "min_lat": None,
            "max_lat": None,
            "min_lon": None,
            "max_lon": None,
        }
    
    total_distance = 0.0
    elevation_gain = 0.0
    elevation_loss = 0.0
    elevations = []
    latitudes = []
    longitudes = []
    timestamps = []
    
    for i, point in enumerate(track_data):
        lat = point.get("latitude")
        lon = point.get("longitude")
        elev = point.get("elevation")
        ts = point.get("timestamp")
        
        if lat is not None and lon is not None:
            latitudes.append(lat)
            longitudes.append(lon)
            
            if i > 0:
                prev_point = track_data[i - 1]
                prev_lat = prev_point.get("latitude")
                prev_lon = prev_point.get("longitude")
                
                if prev_lat is not None and prev_lon is not None:
                    total_distance += calculate_distance(prev_lat, prev_lon, lat, lon)
        
        if elev is not None:
            elevations.append(elev)
            if len(elevations) > 1:
                diff = elev - elevations[-2]
                if diff > 0:
                    elevation_gain += diff
                else:
                    elevation_loss += abs(diff)
        
        if ts is not None:
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except (ValueError, TypeError):
                    ts = None
            if ts:
                timestamps.append(ts)
    
    # Calculate duration
    duration_seconds = None
    if len(timestamps) >= 2:
        duration = timestamps[-1] - timestamps[0]
        duration_seconds = int(duration.total_seconds())
    
    # Calculate average speed (m/s)
    avg_speed = None
    if duration_seconds and duration_seconds > 0:
        avg_speed = total_distance / duration_seconds
    
    return {
        "distance_meters": round(total_distance, 2),
        "duration_seconds": duration_seconds,
        "elevation_gain": round(elevation_gain, 2) if elevations else None,
        "elevation_loss": round(elevation_loss, 2) if elevations else None,
        "max_elevation": max(elevations) if elevations else None,
        "min_elevation": min(elevations) if elevations else None,
        "avg_speed": round(avg_speed, 2) if avg_speed else None,
        "min_lat": min(latitudes) if latitudes else None,
        "max_lat": max(latitudes) if latitudes else None,
        "min_lon": min(longitudes) if longitudes else None,
        "max_lon": max(longitudes) if longitudes else None,
    }
