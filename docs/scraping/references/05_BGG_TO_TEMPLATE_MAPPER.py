# -*- coding: utf-8 -*-
"""
Created on Sat Jan 31 18:06:25 2026

@author: uunse
"""

"""
BGG TO TEMPLATE MAPPER
Konvertiert BGG Cleaned Data → Import Template Format

MAPPING:
- 21 Kern-Felder (aus BGG)
- 30 Leere Felder (für manuelle Befüllung)
- Gesamt: 51 Spalten

VERWENDUNG:
1. Input: bgg_ALL_SPORTS_CLEANED.json
2. Output: bgg_TEMPLATE_IMPORT.xlsx/csv/json
"""

import pandas as pd
import json
import re

# ============================================================================
# TYPE EXTRACTION
# ============================================================================

def extract_type(categories, mechanics):
    """
    Extrahiert Type aus categories + mechanics
    
    Kategorien:
    - Card
    - Dice
    - Card and Dice
    - Tabletop (Default)
    """
    
    if not categories:
        categories = ""
    if not mechanics:
        mechanics = ""
    
    categories_lower = str(categories).lower()
    mechanics_lower = str(mechanics).lower()
    
    # Check für Card und Dice
    has_card = "card game" in categories_lower or \
               "card drafting" in mechanics_lower or \
               "hand management" in mechanics_lower
    
    has_dice = "dice" in categories_lower or \
               "dice rolling" in mechanics_lower
    
    # Kombinationen
    if has_card and has_dice:
        return "Card and Dice"
    
    # Einzelne
    if has_card:
        return "Card"
    
    if has_dice:
        return "Dice"
    
    # Alles andere (Simulation, Board, etc.)
    return "Tabletop"


# ============================================================================
# FIELD TRANSFORMATIONS
# ============================================================================

def transform_players(min_players, max_players):
    """
    Kombiniert min/max players
    Format: "2-8" oder "2"
    """
    
    if pd.isna(min_players) and pd.isna(max_players):
        return ""
    
    if pd.isna(min_players):
        min_players = max_players
    if pd.isna(max_players):
        max_players = min_players
    
    min_p = int(min_players) if min_players else 0
    max_p = int(max_players) if max_players else 0
    
    if min_p == 0 and max_p == 0:
        return ""
    
    if min_p == max_p:
        return str(min_p)
    else:
        return f"{min_p}-{max_p}"


def transform_playtime(min_playtime, max_playtime):
    """
    Kombiniert min/max playtime
    Format: "30-60 min" oder "30 min"
    """
    
    if pd.isna(min_playtime) and pd.isna(max_playtime):
        return ""
    
    if pd.isna(min_playtime):
        min_playtime = max_playtime
    if pd.isna(max_playtime):
        max_playtime = min_playtime
    
    min_t = int(min_playtime) if min_playtime else 0
    max_t = int(max_playtime) if max_playtime else 0
    
    if min_t == 0 and max_t == 0:
        return ""
    
    if min_t == max_t:
        return f"{min_t} min"
    else:
        return f"{min_t}-{max_t} min"


def transform_complexity(complexity_weight):
    """
    Konvertiert complexity_weight zu Text
    0-2: Simple
    2-3.5: Medium
    3.5+: Complex
    """
    
    if pd.isna(complexity_weight) or complexity_weight == 0:
        return ""
    
    weight = float(complexity_weight)
    
    if weight < 2.0:
        return "Simple"
    elif weight < 3.5:
        return "Medium"
    else:
        return "Complex"


def transform_publisher_website_title(row):
    """
    Setzt publisher_website_title
    - Wenn vorhanden und echte URL: behalten
    - Wenn Google Search: "Search on Google"
    - Wenn URL ohne Title: "Publisher Website"
    """
    
    website = str(row.get('publisher_website', ''))
    title = str(row.get('publisher_website_title', ''))
    
    # Wenn Title vorhanden und Website echt
    if title and title != 'nan' and 'google.com/search' not in website:
        return title
    
    # Wenn Google Search
    if 'google.com/search' in website:
        return "Search on Google"
    
    # Wenn Website aber kein Title
    if website and website != 'nan' and 'google.com' not in website:
        return "Publisher Website"
    
    # Sonst leer
    return ""


def split_first(value, separator=';'):
    """
    Gibt ersten Wert aus separierter Liste zurück
    """
    
    if not value or pd.isna(value) or value == '':
        return ""
    
    value_str = str(value)
    
    if separator in value_str:
        return value_str.split(separator)[0].strip()
    else:
        return value_str.strip()


# ============================================================================
# MAIN MAPPING FUNCTION
# ============================================================================

def map_bgg_to_template(input_file='bgg_ALL_SPORTS_CLEANED.json',
                        output_prefix='bgg_TEMPLATE_IMPORT'):
    """
    Mappt BGG Cleaned Data → Template Format
    """
    
    print("="*70)
    print("BGG → TEMPLATE MAPPER")
    print("="*70)
    print(f"Input: {input_file}")
    print("="*70 + "\n")
    
    # Lade BGG Daten
    print("Lade BGG Daten...", end=' ')
    with open(input_file, 'r', encoding='utf-8') as f:
        bgg_games = json.load(f)
    print(f"✓ {len(bgg_games)} Spiele geladen\n")
    
    df_bgg = pd.DataFrame(bgg_games)
    
    print("MAPPE FELDER")
    print("-"*70 + "\n")
    
    # Erstelle Template DataFrame
    template_data = []
    
    for idx, row in df_bgg.iterrows():
        
        # ====================================================================
        # KERN-FELDER (aus BGG)
        # ====================================================================
        
        game = {
            # IDs
            'id': None,  # Auto-increment in Supabase
            'bgg_id': row.get('bgg_id'),
            
            # Basic Info
            'name': row.get('name', ''),
            'subtitle': row.get('short_description', ''),
            'sport': row.get('family_source', ''),  # Alle (auch bei Multi-Family!)
            'sport_id': row.get('family_id'),
            'year': row.get('year_published'),
            'type': extract_type(row.get('categories'), row.get('mechanics')),
            'description': row.get('description', ''),
            
            # Players & Time
            'players': transform_players(row.get('min_players'), row.get('max_players')),
            'playtime': transform_playtime(row.get('min_playtime'), row.get('max_playtime')),
            'complexity': transform_complexity(row.get('complexity_weight')),
            
            # Links
            'bgg_url': row.get('bgg_url', ''),
            'publisher_website_title': transform_publisher_website_title(row),
            'publisher_website': row.get('publisher_website', ''),
            
            # People
            'publisher_name': split_first(row.get('publishers')),
            'authors': row.get('designers', ''),  # ALLE Designer behalten!
            
            # Images
            'image_url': row.get('image_url', ''),
            'thumbnail_url': row.get('thumbnail_url', ''),
            'top_image_url': row.get('top_image_url', ''),
            'image_page_href': row.get('image_page_href', ''),
            
            # ================================================================
            # LEERE FELDER (für manuelle Befüllung später)
            # ================================================================
            
            'link_3': '',
            'verification_status': '',
            'in_out_of_print': '',
            'review': '',
            'series_name': '',
            'format': '',
            'version': '',
            
            # ================================================================
            # EXTRA BGG FELDER (Optional behalten für Referenz)
            # ================================================================
            
            'min_age': row.get('min_age'),
            'average_rating': row.get('average_rating'),
            'bayes_average': row.get('bayes_average'),
            'users_rated': row.get('users_rated'),
            'num_owned': row.get('num_owned'),
            'num_wanting': row.get('num_wanting'),
            'num_wishing': row.get('num_wishing'),
            'num_plays': row.get('num_plays'),
            'overall_rank': row.get('overall_rank'),
            'thematic_rank': row.get('thematic_rank'),
            'strategy_rank': row.get('strategy_rank'),
            
            # Weitere Images (falls anders als oben)
            'image_1_url': '',
            'image_2_url': '',
            'image_3_url': '',
            'logo_url': '',
            'video_url': '',
            
            # Downloads
            'download_1_name': '',
            'download_1_url': '',
            'download_2_name': '',
            'download_2_url': '',
            'download_3_name': '',
            'download_3_url': '',
            
            # Player Counts
            'best_player_count_min': row.get('best_player_count_min'),
            'best_player_count_max': row.get('best_player_count_max'),
            'recommended_player_count_min': row.get('recommended_player_count_min'),
            'recommended_player_count_max': row.get('recommended_player_count_max'),
            
            # Detailed Info
            'categories': row.get('categories', ''),
            'mechanics': row.get('mechanics', ''),
            'families': row.get('families', ''),
            'subdomains': row.get('subdomains', ''),
            
            # Credits
            'artists': row.get('artists', ''),
            'developers': row.get('developers', ''),
            'graphic_designers': row.get('graphic_designers', ''),
            'sculptors': row.get('sculptors', ''),
            'editors': row.get('editors', ''),
            'writers': row.get('writers', ''),
            
            # Other
            'reimplementations': row.get('reimplementations', ''),
            'scraped_at': row.get('scraped_at', ''),
        }
        
        template_data.append(game)
    
    # Erstelle DataFrame
    df_template = pd.DataFrame(template_data)
    
    # SPALTEN-REIHENFOLGE (Wichtigste zuerst)
    column_order = [
        # IDs
        'id', 'bgg_id',
        
        # Basic Info
        'name', 'subtitle', 'sport', 'sport_id', 'year', 'type', 'description',
        
        # Players & Time
        'players', 'playtime', 'complexity',
        
        # Links
        'bgg_url', 'publisher_website_title', 'publisher_website',
        
        # People
        'publisher_name', 'authors',
        
        # Images
        'image_url', 'thumbnail_url', 'top_image_url', 'image_page_href',
        
        # Manual Fill
        'link_3', 'verification_status', 'in_out_of_print', 'review',
        'series_name', 'format', 'version',
        
        # Extra BGG Fields
        'min_age', 'average_rating', 'bayes_average', 'users_rated',
        'num_owned', 'num_wanting', 'num_wishing', 'num_plays',
        'overall_rank', 'thematic_rank', 'strategy_rank',
        
        # More Images
        'image_1_url', 'image_2_url', 'image_3_url', 'logo_url', 'video_url',
        
        # Downloads
        'download_1_name', 'download_1_url',
        'download_2_name', 'download_2_url',
        'download_3_name', 'download_3_url',
        
        # Player Counts
        'best_player_count_min', 'best_player_count_max',
        'recommended_player_count_min', 'recommended_player_count_max',
        
        # Details
        'categories', 'mechanics', 'families', 'subdomains',
        
        # Credits
        'artists', 'developers', 'graphic_designers', 'sculptors',
        'editors', 'writers',
        
        # Other
        'reimplementations', 'scraped_at',
    ]
    
    df_template = df_template[column_order]
    
    # STATISTIKEN
    print("="*70)
    print("MAPPING STATISTIKEN")
    print("="*70 + "\n")
    
    print(f"Gesamt Spiele: {len(df_template)}\n")
    
    print("Type Verteilung:")
    type_counts = df_template['type'].value_counts()
    for type_name, count in type_counts.items():
        print(f"  {type_name:20s}: {count}")
    
    print(f"\nSport Verteilung (Top 10):")
    sport_counts = df_template['sport'].value_counts().head(10)
    for sport, count in sport_counts.items():
        print(f"  {sport:30s}: {count}")
    
    print(f"\nGefüllte Felder:")
    print(f"  Mit Subtitle: {(df_template['subtitle'] != '').sum()}")
    print(f"  Mit Players: {(df_template['players'] != '').sum()}")
    print(f"  Mit Playtime: {(df_template['playtime'] != '').sum()}")
    print(f"  Mit Complexity: {(df_template['complexity'] != '').sum()}")
    print(f"  Mit Authors: {(df_template['authors'] != '').sum()}")
    
    # SPEICHERN
    print("\n" + "="*70)
    print("SPEICHERE TEMPLATE-DATEIEN")
    print("="*70 + "\n")
    
    # Excel
    excel_file = f'{output_prefix}.xlsx'
    df_template.to_excel(excel_file, index=False, engine='openpyxl')
    print(f"✓ {excel_file}")
    
    # CSV
    csv_file = f'{output_prefix}.csv'
    df_template.to_csv(csv_file, index=False, encoding='utf-8')
    print(f"✓ {csv_file}")
    
    # JSON
    json_file = f'{output_prefix}.json'
    df_template.to_json(json_file, orient='records', indent=2, force_ascii=False)
    print(f"✓ {json_file}")
    
    # BEISPIELE
    print("\n" + "="*70)
    print("BEISPIEL-SPIELE")
    print("="*70 + "\n")
    
    # Zeige verschiedene Types
    for game_type in ['Card', 'Dice', 'Card and Dice', 'Tabletop']:
        examples = df_template[df_template['type'] == game_type].head(1)
        if len(examples) > 0:
            example = examples.iloc[0]
            print(f"[{game_type}]")
            print(f"  Name: {example['name']}")
            print(f"  Sport: {example['sport']}")
            print(f"  Players: {example['players']}")
            print(f"  Playtime: {example['playtime']}")
            print(f"  Complexity: {example['complexity']}")
            print(f"  Authors: {example['authors'][:50]}...")
            print()
    
    print("="*70)
    print("🎉 MAPPING ABGESCHLOSSEN!")
    print("="*70)
    print(f"\n✅ {len(df_template)} Spiele konvertiert")
    print(f"✅ {len(df_template.columns)} Spalten")
    print(f"✅ Bereit für Supabase Import!")
    
    return df_template


# ============================================================================
# AUSFÜHRUNG
# ============================================================================

if __name__ == "__main__":
    
    print("\n" + "="*70)
    print("BGG TO TEMPLATE CONVERTER")
    print("="*70)
    print("\nKonvertiert BGG Cleaned Data → Import Template Format")
    print("\nMAPPINGS:")
    print("  - type: Card / Dice / Card and Dice / Tabletop")
    print("  - players: '2-8' oder '2'")
    print("  - playtime: '30-60 min' oder '30 min'")
    print("  - sport: Alle (auch Multi-Family)")
    print("  - authors: Alle Designer")
    print("="*70 + "\n")
    
    input("Drücke ENTER um zu starten...")
    
    # Konvertiere
    df_template = map_bgg_to_template(
        input_file='bgg_ALL_SPORTS_CLEANED.json',
        output_prefix='bgg_TEMPLATE_IMPORT'
    )
    
    print("\n📁 Template-Dateien erstellt!")
    print("📊 Bereit für Import in Supabase!")