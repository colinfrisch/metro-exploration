#!/usr/bin/env python3
"""
Enrich Paris Metro stations data with place recommendations using Mistral API.
Uses batch processing and async requests for cost efficiency.
"""

import json
import os
import asyncio
import time
from pathlib import Path
from mistralai import Mistral
from dotenv import load_dotenv
from tqdm.asyncio import tqdm

load_dotenv()  # Load environment variables from .env file


# Schema for structured output (ensures consistent responses)
RECOMMENDATIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "places": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "type": {"type": "string", "enum": ["restaurant", "monument", "musée", "parc", "shopping", "café", "bar", "autre"]},
                    "description": {"type": "string"},
                    "address": {"type": "string"}
                },
                "required": ["name", "type", "description", "address"]
            }
        }
    },
    "required": ["places"]
}


async def get_station_recommendations(client, station_id: str, station_data: dict, semaphore, pbar):
    """Get recommendations for a single station using Mistral API."""
    async with semaphore:  # Limit concurrent requests
        try:
            station_name = station_data["name"]
            
            response = await client.chat.complete_async(
                model="mistral-small-latest",
                messages=[
                    {
                        "role": "system",
                        "content": "Guide touristique parisien concis. Expert en recommandataions très locales."
                    },
                    {
                        "role": "user",
                        "content": f"Station de métro {station_name}: liste exactement 4 lieux intéressants **à proximité immédiate (strictement moins de 100 mètres)** (nom, type, description courte, adresse)."
                    }
                ],
                temperature=0.3,  # Lower = more consistent, cheaper
                max_tokens=500,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "recommendations",
                        "strict": True,
                        "schema": RECOMMENDATIONS_SCHEMA
                    }
                }
            )
            
            # Parse the response
            content = response.choices[0].message.content
            recommendations = json.loads(content)
            
            pbar.update(1)
            return station_id, recommendations["places"]
            
        except Exception as e:
            pbar.write(f"✗ Error for {station_data.get('name', station_id)}: {e}")
            pbar.update(1)
            # Return empty recommendations on error
            return station_id, None


async def process_all_stations(stations_dict: dict, api_key: str, batch_size: int = 50):
    """Process all stations with rate limiting."""
    client = Mistral(api_key=api_key)
    
    # Semaphore to limit concurrent requests (avoid rate limits)
    semaphore = asyncio.Semaphore(batch_size)
    
    stations = stations_dict["stations"]
    total = len(stations)
    
    # Create progress bar
    pbar = tqdm(total=total, desc="Processing stations", unit="station")
    
    # Create tasks for all stations
    tasks = [
        get_station_recommendations(client, station_id, station_data, semaphore, pbar)
        for station_id, station_data in stations.items()
    ]
    
    # Process all tasks
    results = await asyncio.gather(*tasks)
    pbar.close()
    
    # Build recommendations dict (separate from station data)
    recommendations_dict = {}
    for station_id, recommendations in results:
        if recommendations:  # Only add if we got recommendations
            recommendations_dict[station_id] = recommendations
    
    return recommendations_dict


def main():
    """Main function to orchestrate the enrichment process."""
    # Get API key from environment variable for security
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("Error: MISTRAL_API_KEY environment variable not set")
        return
    
    # Load existing stations data
    script_dir = Path(__file__).parent
    input_file = script_dir.parent / "data" / "stations.json"
    recommendations_file = script_dir.parent / "data" / "station_recommendations.json"
    
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            stations_dict = json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {input_file}")
        return
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {input_file}: {e}")
        return
    
    # Process stations
    recommendations_data = asyncio.run(process_all_stations(stations_dict, api_key, batch_size=50))
    
    # Save recommendations to separate file
    with open(recommendations_file, "w", encoding="utf-8") as f:
        json.dump(recommendations_data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()