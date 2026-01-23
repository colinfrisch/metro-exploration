#!/usr/bin/env python3
"""
Enrich metro stations data with place recommendations using Mistral API.
Supports multiple cities with modular configuration.
Uses batch processing and async requests for cost efficiency.
"""

import json
import os
import asyncio
import argparse
from pathlib import Path
from mistralai import Mistral
from dotenv import load_dotenv
from tqdm.asyncio import tqdm

load_dotenv()  # Load environment variables from .env file


# City configurations with language and context settings
CITY_CONFIGS = {
    "paris": {
        "name": "Paris",
        "language": "french",
        "system_prompt": "Guide touristique parisien concis. Expert en recommandations très locales.",
        "user_prompt_template": "Station de métro {station_name}: liste exactement 4 lieux intéressants **à proximité immédiate (strictement moins de 100 mètres)** (nom, type, description courte, adresse).",
        "place_types": ["restaurant", "monument", "musée", "parc", "shopping", "café", "bar", "autre"]
    },
    "london": {
        "name": "London",
        "language": "english",
        "system_prompt": "Concise London tourist guide. Expert in very local recommendations.",
        "user_prompt_template": "{station_name} tube station: list exactly 4 interesting places **in immediate proximity (strictly less than 100 meters)** (name, type, short description, address).",
        "place_types": ["restaurant", "monument", "museum", "park", "shopping", "café", "pub", "other"]
    },
    "singapore": {
        "name": "Singapore",
        "language": "english",
        "system_prompt": "Concise Singapore tourist guide. Expert in very local recommendations for MRT stations.",
        "user_prompt_template": "{station_name} MRT station: list exactly 4 interesting places **in immediate proximity (strictly less than 100 meters)** (name, type, short description, address).",
        "place_types": ["restaurant", "monument", "museum", "park", "shopping", "café", "hawker", "other"]
    }
}


def get_recommendations_schema(place_types):
    """Generate schema with city-specific place types."""
    return {
        "type": "object",
        "properties": {
            "places": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "type": {"type": "string", "enum": place_types},
                        "description": {"type": "string"},
                        "address": {"type": "string"}
                    },
                    "required": ["name", "type", "description", "address"]
                }
            }
        },
        "required": ["places"]
    }


async def get_station_recommendations(client, station_id: str, station_data: dict, city_config: dict, semaphore, pbar):
    """Get recommendations for a single station using Mistral API."""
    async with semaphore:  # Limit concurrent requests
        try:
            station_name = station_data["name"]
            
            response = await client.chat.complete_async(
                model="mistral-small-latest",
                messages=[
                    {
                        "role": "system",
                        "content": city_config["system_prompt"]
                    },
                    {
                        "role": "user",
                        "content": city_config["user_prompt_template"].format(station_name=station_name)
                    }
                ],
                temperature=0.3,  # Lower = more consistent, cheaper
                max_tokens=500,
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "recommendations",
                        "strict": True,
                        "schema": get_recommendations_schema(city_config["place_types"])
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


async def process_all_stations(stations_dict: dict, api_key: str, city_config: dict, batch_size: int = 50):
    """Process all stations with rate limiting."""
    client = Mistral(api_key=api_key)
    
    # Semaphore to limit concurrent requests (avoid rate limits)
    semaphore = asyncio.Semaphore(batch_size)
    
    stations = stations_dict["stations"]
    total = len(stations)
    
    # Create progress bar
    pbar = tqdm(total=total, desc=f"Processing {city_config['name']} stations", unit="station")
    
    # Create tasks for all stations
    tasks = [
        get_station_recommendations(client, station_id, station_data, city_config, semaphore, pbar)
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


def get_available_cities():
    """Get list of cities that have station data available."""
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data"
    
    available = []
    for city in CITY_CONFIGS.keys():
        city_dir = data_dir / city
        stations_file = city_dir / "stations.json"
        if stations_file.exists():
            available.append(city)
    
    return available


def main():
    """Main function to orchestrate the enrichment process."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Generate station recommendations for metro systems")
    parser.add_argument(
        "--city", "-c",
        type=str,
        choices=list(CITY_CONFIGS.keys()),
        help="City to process (default: all available cities)"
    )
    parser.add_argument(
        "--batch-size", "-b",
        type=int,
        default=50,
        help="Number of concurrent API requests (default: 50)"
    )
    parser.add_argument(
        "--list-cities", "-l",
        action="store_true",
        help="List available cities and exit"
    )
    args = parser.parse_args()
    
    # List available cities if requested
    available_cities = get_available_cities()
    
    if args.list_cities:
        print("Available cities:")
        for city in available_cities:
            config = CITY_CONFIGS[city]
            print(f"  - {city}: {config['name']} ({config['language']})")
        return
    
    # Get API key from environment variable for security
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("Error: MISTRAL_API_KEY environment variable not set")
        return
    
    # Determine which cities to process
    cities_to_process = [args.city] if args.city else available_cities
    
    if not cities_to_process:
        print("Error: No cities available to process. Make sure station data exists.")
        return
    
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data"
    
    for city in cities_to_process:
        if city not in available_cities:
            print(f"Warning: Skipping {city} - no station data found")
            continue
            
        city_config = CITY_CONFIGS[city]
        city_dir = data_dir / city
        
        input_file = city_dir / "stations.json"
        recommendations_file = city_dir / "station_recommendations.json"
        
        print(f"\n{'='*50}")
        print(f"Processing {city_config['name']}...")
        print(f"{'='*50}")
        
        try:
            with open(input_file, "r", encoding="utf-8") as f:
                stations_dict = json.load(f)
        except FileNotFoundError:
            print(f"Error: File not found: {input_file}")
            continue
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in {input_file}: {e}")
            continue
        
        # Process stations
        recommendations_data = asyncio.run(
            process_all_stations(stations_dict, api_key, city_config, batch_size=args.batch_size)
        )
        
        # Save recommendations to separate file
        with open(recommendations_file, "w", encoding="utf-8") as f:
            json.dump(recommendations_data, f, ensure_ascii=False, indent=2)
        
        print(f"✓ Saved {len(recommendations_data)} recommendations to {recommendations_file}")
    
    print(f"\n{'='*50}")
    print("Done!")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()