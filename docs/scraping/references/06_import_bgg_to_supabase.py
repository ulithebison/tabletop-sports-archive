#!/usr/bin/env python3
"""
Tabletop Sports Games - BGG Import Script (FIXED)
Imports ONLY NEW games (skips existing bgg_id's)
"""

import pandas as pd
from supabase import create_client, Client
import sys
import os
from datetime import datetime
import numpy as np

# ============================================
# CONFIGURATION
# ============================================

# Supabase credentials
SUPABASE_URL = "https://hfbkmqzffrletmqwzvme.supabase.co"
SUPABASE_KEY = "sb_publishable_SUnKsiEfhaCHv_dcOguhSQ_Mes30BLv"

# Excel file path
EXCEL_FILE = "bgg_TEMPLATE_IMPORT.xlsx"

# Dry run mode (set to False to actually import)
DRY_RUN = False

# Batch size
BATCH_SIZE = 100

# ============================================
# INITIALIZE SUPABASE CLIENT
# ============================================

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
except Exception as e:
    print(f"❌ Failed to connect to Supabase: {e}")
    sys.exit(1)

# ============================================
# HELPER FUNCTIONS
# ============================================

def clean_value(value):
    """Convert NaN and empty values to None"""
    if pd.isna(value):
        return None
    if isinstance(value, str) and value.strip() == '':
        return None
    if isinstance(value, (int, float)) and np.isnan(value):
        return None
    return value


def convert_to_int(value):
    """Convert float to int, handle NaN"""
    if pd.isna(value):
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def convert_to_float(value):
    """Convert to float, handle NaN"""
    if pd.isna(value):
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def prepare_game_data(row):
    """Prepare game data from Excel row"""
    
    data = {}
    
    # Define field types
    integer_fields = {
        'bgg_id', 'sport_id', 'year', 'min_age', 
        'users_rated', 'num_owned', 'num_wanting', 
        'num_wishing', 'num_plays', 'overall_rank', 
        'thematic_rank', 'strategy_rank',
        'best_player_count_min', 'best_player_count_max',
        'recommended_player_count_min', 'recommended_player_count_max'
    }
    
    float_fields = {
        'average_rating', 'bayes_average'
    }
    
    # Map Excel columns to database columns
    column_mapping = {
        'bgg_id': 'bgg_id',
        'name': 'name',
        'subtitle': 'subtitle',
        'sport': 'sport',
        'sport_id': 'sport_id',
        'year': 'year',
        'type': 'type',
        'description': 'description',
        'players': 'players',
        'playtime': 'playtime',
        'complexity': 'complexity',
        'bgg_url': 'bgg_url',
        'publisher_website_title': 'publisher_website_title',
        'publisher_website': 'publisher_website',
        'publisher_name': 'publisher_name',
        'authors': 'authors',
        'image_url': 'image_url',
        'thumbnail_url': 'thumbnail_url',
        'top_image_url': 'top_image_url',
        'image_page_href': 'image_page_href',
        'min_age': 'min_age',
        'average_rating': 'average_rating',
        'bayes_average': 'bayes_average',
        'users_rated': 'users_rated',
        'num_owned': 'num_owned',
        'num_wanting': 'num_wanting',
        'num_wishing': 'num_wishing',
        'num_plays': 'num_plays',
        'overall_rank': 'overall_rank',
        'thematic_rank': 'thematic_rank',
        'strategy_rank': 'strategy_rank',
        'best_player_count_min': 'best_player_count_min',
        'best_player_count_max': 'best_player_count_max',
        'recommended_player_count_min': 'recommended_player_count_min',
        'recommended_player_count_max': 'recommended_player_count_max',
        'categories': 'categories',
        'mechanics': 'mechanics',
        'families': 'families',
        'subdomains': 'subdomains',
        'artists': 'artists',
        'developers': 'developers',
        'graphic_designers': 'graphic_designers',
        'sculptors': 'sculptors',
        'editors': 'editors',
        'writers': 'writers',
        'reimplementations': 'reimplementations',
        'scraped_at': 'scraped_at'
    }
    
    # Map and clean values
    for excel_col, db_col in column_mapping.items():
        if excel_col in row.index:
            value = row[excel_col]
            
            if db_col in integer_fields:
                value = convert_to_int(value)
            elif db_col in float_fields:
                value = convert_to_float(value)
            else:
                value = clean_value(value)
            
            data[db_col] = value
    
    # Add source
    data['source'] = 'bgg'
    
    return data


def validate_game(data):
    """Validate required fields"""
    required = ['name', 'sport', 'type']
    missing = [field for field in required if not data.get(field)]
    
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    
    return True, None


def get_existing_bgg_ids():
    """
    Fetch ALL existing bgg_id's from Supabase
    
    FIX: Handles pagination to get ALL games (not just first 1000)
    """
    print("\n🔍 Fetching existing games from Supabase...")
    
    existing_ids = set()
    offset = 0
    page_size = 1000
    
    try:
        while True:
            # Fetch page
            result = supabase.table('games')\
                .select('bgg_id')\
                .range(offset, offset + page_size - 1)\
                .execute()
            
            if not result.data:
                break
            
            # Add to set
            page_ids = [game['bgg_id'] for game in result.data if game.get('bgg_id')]
            existing_ids.update(page_ids)
            
            print(f"  📄 Fetched {len(result.data)} games (offset {offset})")
            
            # Check if we got less than page_size (last page)
            if len(result.data) < page_size:
                break
            
            offset += page_size
        
        print(f"✅ Found {len(existing_ids)} existing games in database")
        return existing_ids
        
    except Exception as e:
        print(f"⚠️  Error fetching existing games: {e}")
        print(f"   Continuing anyway (may encounter duplicates)")
        return set()


def import_batch(batch_data):
    """Import a batch of games"""
    try:
        if DRY_RUN:
            return len(batch_data), 0
        
        result = supabase.table('games').insert(batch_data).execute()
        return len(batch_data), 0
        
    except Exception as e:
        print(f"  ❌ Batch error: {e}")
        # Try individual inserts
        success = 0
        failed = 0
        for game in batch_data:
            try:
                supabase.table('games').insert(game).execute()
                success += 1
            except Exception as e2:
                failed += 1
                print(f"    ❌ Failed: {game.get('name')} - {e2}")
        return success, failed


# ============================================
# MAIN IMPORT FUNCTION
# ============================================

def import_games():
    """Main import function - ONLY NEW GAMES"""
    
    print("\n" + "="*80)
    print("🎮 TABLETOP SPORTS GAMES - BGG IMPORT (NEW GAMES ONLY)")
    print("="*80)
    
    # Check Excel file
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ Excel file not found: {EXCEL_FILE}")
        print(f"   Current directory: {os.getcwd()}")
        return
    
    # Read Excel
    print(f"\n📖 Reading Excel file: {EXCEL_FILE}")
    try:
        df = pd.read_excel(EXCEL_FILE)
        print(f"✅ Found {len(df)} rows in Excel")
        print(f"✅ Found {len(df.columns)} columns")
    except Exception as e:
        print(f"❌ Error reading Excel: {e}")
        return
    
    # Get existing bgg_id's from Supabase
    existing_ids = get_existing_bgg_ids()
    
    # Filter: Keep only NEW games (bgg_id not in Supabase)
    print(f"\n🔍 Filtering for NEW games...")
    
    # Get bgg_id column
    if 'bgg_id' not in df.columns:
        print(f"❌ Excel missing 'bgg_id' column!")
        return
    
    # Before filter
    total_in_excel = len(df)
    
    # Filter out existing
    df_new = df[~df['bgg_id'].isin(existing_ids)].copy()
    
    # After filter
    new_count = len(df_new)
    already_exists_count = total_in_excel - new_count
    
    print(f"\n📊 FILTER RESULTS:")
    print(f"  Total in Excel:     {total_in_excel}")
    print(f"  Already in DB:      {already_exists_count} (skipped)")
    print(f"  NEW to import:      {new_count}")
    
    if new_count == 0:
        print(f"\n✅ All games already in database - nothing to import!")
        return
    
    # Show preview of NEW games
    print(f"\n👀 Preview of NEW games (first 5):")
    preview_cols = ['bgg_id', 'name', 'sport', 'type', 'year']
    available_cols = [col for col in preview_cols if col in df_new.columns]
    print(df_new.head(5)[available_cols].to_string())
    
    # Dry run warning
    if DRY_RUN:
        print(f"\n⚠️  DRY RUN MODE - No data will be written!")
        print(f"   Change DRY_RUN = False in script to actually import")
    
    # Confirm
    print(f"\n{'='*80}")
    response = input(f"Import {new_count} NEW games? (y/n): ")
    if response.lower() != 'y':
        print("❌ Import cancelled")
        return
    
    # Statistics
    stats = {
        'total_in_excel': total_in_excel,
        'already_exists': already_exists_count,
        'to_import': new_count,
        'success': 0,
        'failed': 0,
        'skipped': 0
    }
    
    # Prepare games
    print(f"\n{'='*80}")
    print("🔄 PREPARING DATA...")
    print(f"{'='*80}\n")
    
    games_to_import = []
    
    for index, row in df_new.iterrows():
        # Prepare game data
        game_data = prepare_game_data(row)
        
        # Validate
        is_valid, error = validate_game(game_data)
        if not is_valid:
            print(f"⚠️  Row {index + 2}: {row.get('name', 'Unknown')} - {error}")
            stats['skipped'] += 1
            continue
        
        games_to_import.append(game_data)
    
    print(f"✅ Prepared {len(games_to_import)} valid games")
    if stats['skipped'] > 0:
        print(f"⚠️  Skipped {stats['skipped']} invalid games")
    
    # Import in batches
    print(f"\n{'='*80}")
    print(f"🚀 IMPORTING IN BATCHES OF {BATCH_SIZE}...")
    print(f"{'='*80}\n")
    
    total_batches = (len(games_to_import) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(games_to_import))
        batch = games_to_import[start_idx:end_idx]
        
        print(f"📦 Batch {batch_num + 1}/{total_batches}: Games {start_idx + 1}-{end_idx}")
        
        success, failed = import_batch(batch)
        stats['success'] += success
        stats['failed'] += failed
        
        if DRY_RUN:
            print(f"  ✅ Would import {len(batch)} games")
        else:
            print(f"  ✅ Imported {success} games, ❌ Failed {failed}")
    
    # Final report
    print(f"\n{'='*80}")
    print("📊 IMPORT COMPLETE!")
    print(f"{'='*80}")
    print(f"Total in Excel:      {stats['total_in_excel']}")
    print(f"Already in DB:       {stats['already_exists']} (skipped)")
    print(f"New to import:       {stats['to_import']}")
    print(f"✅ Imported:         {stats['success']}")
    print(f"❌ Failed:           {stats['failed']}")
    print(f"⚠️  Validation skip:  {stats['skipped']}")
    
    if stats['success'] > 0:
        success_rate = (stats['success'] / stats['to_import']) * 100
        print(f"\n📈 Success rate: {success_rate:.1f}%")
    
    if DRY_RUN:
        print(f"\n⚠️  This was a DRY RUN - no data was written!")
        print(f"   Change DRY_RUN = False to actually import")
    else:
        print(f"\n🎉 Import successful!")
        print(f"   Total games in DB now: {len(existing_ids) + stats['success']}")
    
    print(f"{'='*80}\n")


# ============================================
# RUN
# ============================================

if __name__ == "__main__":
    import_games()