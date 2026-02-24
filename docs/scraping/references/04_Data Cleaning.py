"""
BGG DATA CLEANER - COMPLETE WITH FAMILY ID & NAME CLEANING
Bereinigt die Master-Database vollständig für Supabase Import

NEUE FEATURES:
- Family ID: Einzeln → Integer, Multi → String
- Family Source: Auto-Clean + Custom Mapping
- Alle bisherigen Bereinigungen

VERWENDUNG:
1. Führe nach dem Merger aus
2. Input: bgg_ALL_SPORTS_MERGED.json
3. Output: bgg_ALL_SPORTS_CLEANED.json/xlsx/csv
"""

import pandas as pd
import json
import re
import html
from urllib.parse import quote_plus

# ============================================================================
# CUSTOM FAMILY NAME MAPPING
# ============================================================================

CUSTOM_FAMILY_NAMES = {
    # KEINE Custom Mappings - Alle Namen bleiben wie BGG!
    # Dieses Dictionary ist leer, weil wir nur auto_clean nutzen
}


# ============================================================================
# FAMILY NAME CLEANING FUNCTIONS
# ============================================================================

def auto_clean_family_name(name):
    """
    Automatische Bereinigung von BGG Family Namen
    Entfernt nur "Sports:" und "Sports " Prefix
    
    WICHTIG: Behält ALLE anderen Teile des Namens!
    """
    
    if not name or pd.isna(name):
        return ''
    
    clean_name = str(name).strip()
    
    # Entferne "Sports:" Prefix
    clean_name = re.sub(r'^Sports:\s*', '', clean_name, flags=re.IGNORECASE)
    
    # Entferne "Sports " Prefix (aber nur am Anfang!)
    if clean_name.startswith('Sports '):
        clean_name = clean_name[7:]  # Entferne "Sports "
    
    return clean_name.strip()


def apply_custom_mapping(name):
    """
    Wendet Custom Mapping an
    
    Aktuell: KEINE Custom Mappings - gibt Name unverändert zurück
    """
    
    # Keine Custom Mappings mehr!
    return name


def clean_family_source(family_source_value):
    """
    Bereinigt family_source Feld komplett:
    1. Split bei Separator
    2. Auto-Clean jeden Namen
    3. Custom Mapping jeden Namen
    4. Wieder zusammenfügen
    """
    if not family_source_value or pd.isna(family_source_value):
        return ''
    
    source_str = str(family_source_value)
    
    # Split bei Separator
    families = [f.strip() for f in source_str.split(';') if f.strip()]
    
    # Bereinige jeden Namen
    cleaned_families = []
    for family in families:
        # Step 1: Auto-Clean
        cleaned = auto_clean_family_name(family)
        # Step 2: Custom Mapping
        cleaned = apply_custom_mapping(cleaned)
        if cleaned:
            cleaned_families.append(cleaned)
    
    # Entferne Duplikate und sortiere
    unique_families = sorted(set(cleaned_families))
    
    # Wieder zusammenfügen
    return '; '.join(unique_families)


# ============================================================================
# FAMILY ID CLEANING
# ============================================================================

def clean_family_id(family_id_value):
    """
    Konvertiert Family ID:
    - Einzelne ID → Integer (5640)
    - Multi-ID → String mit Separator ("5640; 5839")
    """
    if not family_id_value or pd.isna(family_id_value):
        return None
    
    family_id_str = str(family_id_value).strip()
    
    # Entferne ungültige Werte
    if family_id_str.lower() in ['none', 'null', 'false', '']:
        return None
    
    # Check ob Multi-Family (enthält Separator)
    if ';' in family_id_str:
        # Multi-Family: Bleibt String
        # Bereinige IDs (entferne Spaces, sortiere)
        ids = [id.strip() for id in family_id_str.split(';') if id.strip()]
        unique_ids = sorted(set(ids))
        return '; '.join(unique_ids)
    else:
        # Single Family: Konvertiere zu Integer
        try:
            return int(family_id_str)
        except:
            return None


# ============================================================================
# HTML & TEXT CLEANING
# ============================================================================

def clean_html_text(text):
    """
    Entfernt HTML-Tags und dekodiert HTML-Entities
    """
    if not text or pd.isna(text) or text == '':
        return ''
    
    text = str(text)
    
    # HTML-Entities dekodieren
    text = html.unescape(text)
    
    # <br> → Zeilenumbruch
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    
    # Closing tags → Zeilenumbruch
    text = re.sub(r'</(?:p|li|ul|ol|div)>', '\n', text, flags=re.IGNORECASE)
    
    # Alle HTML-Tags entfernen
    text = re.sub(r'<[^>]+>', '', text)
    
    # Mehrfache Zeilenumbrüche normalisieren
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    
    # Whitespaces pro Zeile
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)
    
    # Mehrfache Leerzeichen
    text = re.sub(r' +', ' ', text)
    
    return text.strip()


# ============================================================================
# NUMERIC FIELD CLEANING
# ============================================================================

def clean_year(year_value):
    """Konvertiert year_published zu Integer"""
    if pd.isna(year_value) or year_value == '' or year_value == '0':
        return None
    
    try:
        year = int(str(year_value))
        if 1800 <= year <= 2100:
            return year
        else:
            return None
    except:
        return None


def clean_numeric_field(value, allow_zero=True):
    """Konvertiert numerische Felder zu Int oder Float"""
    if pd.isna(value) or value == '':
        return None
    
    # Ungültige String-Werte
    invalid_values = ['false', 'null', 'none', 'n/a', 'na']
    if str(value).lower().strip() in invalid_values:
        return None
    
    try:
        num = float(value)
        
        if num == 0 and not allow_zero:
            return None
        
        # Ganze Zahl → Int
        if num.is_integer():
            return int(num)
        else:
            return num
    except:
        return None


def clean_rank(rank_value):
    """Konvertiert Rank-Felder zu Integer oder None"""
    if pd.isna(rank_value) or rank_value == '':
        return None
    
    rank_str = str(rank_value).lower().strip()
    
    if rank_str in ['not ranked', 'false', 'null', 'none', 'n/a', '0']:
        return None
    
    try:
        rank = int(rank_value)
        if 1 <= rank <= 1000000:
            return rank
        else:
            return None
    except:
        return None


# ============================================================================
# PUBLISHER WEBSITE CLEANING
# ============================================================================

def is_valid_url(url):
    """Prüft ob ein String eine gültige URL ist"""
    if not url or pd.isna(url):
        return False
    
    url_str = str(url).strip().lower()
    
    invalid_values = ['false', 'null', 'none', 'n/a', 'na', '0', '']
    if url_str in invalid_values:
        return False
    
    if url_str.startswith('http://') or url_str.startswith('https://'):
        return True
    
    return False


def create_google_search_url(game_name):
    """Erstellt eine Google-Suche URL für ein Spiel"""
    if not game_name or pd.isna(game_name):
        return ''
    
    clean_name = str(game_name).strip()
    search_query = f"{clean_name} tabletop sports game"
    encoded_query = quote_plus(search_query)
    
    return f"https://www.google.com/search?q={encoded_query}"


def clean_publisher_website(row):
    """
    Bereinigt Publisher Website
    - Gültige URL → behalten
    - Ungültig → Google Suche
    """
    url = row.get('publisher_website', '')
    
    if is_valid_url(url):
        return str(url).strip()
    else:
        return create_google_search_url(row.get('name', ''))


# ============================================================================
# MAIN CLEANING FUNCTION
# ============================================================================

def clean_bgg_database(input_file='bgg_ALL_SPORTS_MERGED.json', 
                       output_prefix='bgg_ALL_SPORTS_CLEANED'):
    """
    Bereinigt die komplette BGG Database
    """
    
    print("="*70)
    print("BGG DATA CLEANER - COMPLETE")
    print("="*70)
    print(f"Input: {input_file}")
    print("="*70 + "\n")
    
    # Lade Daten
    print("Lade Daten...", end=' ')
    with open(input_file, 'r', encoding='utf-8') as f:
        games = json.load(f)
    print(f"✓ {len(games)} Spiele geladen\n")
    
    # Konvertiere zu DataFrame
    df = pd.DataFrame(games)
    
    print("BEREINIGE FELDER")
    print("-"*70 + "\n")
    
    # 1. BGG_ID
    print("1. bgg_id...", end=' ')
    df['bgg_id'] = df['bgg_id'].apply(lambda x: int(x) if x else None)
    print("✓")
    
    # 2. FAMILY_SOURCE (NEU mit Auto-Clean + Custom Mapping!)
    print("2. family_source (mit Name Cleaning)...", end=' ')
    df['family_source'] = df['family_source'].apply(clean_family_source)
    print("✓")
    
    # 3. FAMILY_ID (NEU mit Integer/String Logic!)
    print("3. family_id (Integer/String)...", end=' ')
    df['family_id'] = df['family_id'].apply(clean_family_id)
    
    # Statistik
    integer_ids = df['family_id'].apply(lambda x: isinstance(x, int)).sum()
    string_ids = df['family_id'].apply(lambda x: isinstance(x, str)).sum()
    print(f"✓ ({integer_ids} Integer, {string_ids} String)")
    
    # 4. YEAR_PUBLISHED
    print("4. year_published...", end=' ')
    df['year_published'] = df['year_published'].apply(clean_year)
    valid_years = df['year_published'].notna().sum()
    print(f"✓ ({valid_years}/{len(df)} gültig)")
    
    # 5. PLAYER & TIME FIELDS
    player_time_fields = {
        'min_players': 'Min Players',
        'max_players': 'Max Players',
        'min_playtime': 'Min Playtime',
        'max_playtime': 'Max Playtime',
        'min_age': 'Min Age'
    }
    
    print("5. Spieler & Zeit Felder:")
    for field, label in player_time_fields.items():
        if field in df.columns:
            print(f"   - {label}...", end=' ')
            df[field] = df[field].apply(lambda x: clean_numeric_field(x, allow_zero=False))
            valid = df[field].notna().sum()
            print(f"✓ ({valid}/{len(df)})")
    
    # 6. RATING FIELDS
    rating_fields = {
        'average_rating': 'Average Rating',
        'bayes_average': 'Bayes Average',
        'complexity_weight': 'Complexity Weight'
    }
    
    print("6. Rating Felder:")
    for field, label in rating_fields.items():
        if field in df.columns:
            print(f"   - {label}...", end=' ')
            df[field] = df[field].apply(clean_numeric_field)
            valid = df[field].notna().sum()
            print(f"✓ ({valid}/{len(df)})")
    
    # 7. COUNT FIELDS
    count_fields = {
        'users_rated': 'Users Rated',
        'num_owned': 'Num Owned',
        'num_wanting': 'Num Wanting',
        'num_wishing': 'Num Wishing',
        'num_plays': 'Num Plays',
        'best_player_count_min': 'Best Players Min',
        'best_player_count_max': 'Best Players Max',
        'recommended_player_count_min': 'Recommended Players Min',
        'recommended_player_count_max': 'Recommended Players Max'
    }
    
    print("7. Count Felder:")
    for field, label in count_fields.items():
        if field in df.columns:
            print(f"   - {label}...", end=' ')
            df[field] = df[field].apply(clean_numeric_field)
            valid = df[field].notna().sum()
            print(f"✓ ({valid}/{len(df)})")
    
    # 8. RANK FIELDS
    rank_fields = {
        'overall_rank': 'Overall Rank',
        'thematic_rank': 'Thematic Rank',
        'strategy_rank': 'Strategy Rank'
    }
    
    print("8. Rank Felder:")
    for field, label in rank_fields.items():
        if field in df.columns:
            print(f"   - {label}...", end=' ')
            df[field] = df[field].apply(clean_rank)
            ranked = df[field].notna().sum()
            print(f"✓ ({ranked}/{len(df)} ranked)")
    
    # 9. DESCRIPTION
    print("9. description...", end=' ')
    df['description'] = df['description'].apply(clean_html_text)
    with_desc = (df['description'] != '').sum()
    print(f"✓ ({with_desc}/{len(df)} mit Text)")
    
    # 10. SHORT_DESCRIPTION
    print("10. short_description...", end=' ')
    df['short_description'] = df['short_description'].apply(clean_html_text)
    print("✓")
    
    # 11. PUBLISHER WEBSITE
    print("11. publisher_website...", end=' ')
    df['publisher_website'] = df.apply(clean_publisher_website, axis=1)
    
    real_urls = df['publisher_website'].apply(
        lambda x: x.startswith('http://') or x.startswith('https://') if x else False
    ).sum()
    google_searches = df['publisher_website'].apply(
        lambda x: 'google.com/search' in x if x else False
    ).sum()
    
    print(f"✓ ({real_urls} URLs, {google_searches} Google)")
    
    # 12. TEXT FIELDS
    text_fields = [
        'name', 'bgg_url', 'image_url', 'thumbnail_url', 'top_image_url',
        'publisher_website_title',
        'categories', 'mechanics', 'families', 'designers', 'publishers',
        'subdomains', 'artists', 'developers', 'graphic_designers',
        'sculptors', 'editors', 'writers', 'reimplementations'
    ]
    
    print("12. Text-Felder trimmen:")
    for field in text_fields:
        if field in df.columns:
            df[field] = df[field].apply(
                lambda x: str(x).strip() if x and not pd.isna(x) and str(x).lower() not in ['false', 'null', 'none'] else ''
            )
    print("    ✓ Alle Text-Felder getrimmt")
    
    # SPEICHERN
    print("\n" + "="*70)
    print("SPEICHERE BEREINIGTE DATEN")
    print("="*70 + "\n")
    
    # JSON
    json_file = f'{output_prefix}.json'
    df.to_json(json_file, orient='records', indent=2, force_ascii=False)
    print(f"✓ {json_file}")
    
    # Excel
    excel_file = f'{output_prefix}.xlsx'
    df.to_excel(excel_file, index=False, engine='openpyxl')
    print(f"✓ {excel_file}")
    
    # CSV
    csv_file = f'{output_prefix}.csv'
    df.to_csv(csv_file, index=False, encoding='utf-8')
    print(f"✓ {csv_file}")
    
    # STATISTIKEN
    print("\n" + "="*70)
    print("BEREINIGUNGSSTATISTIKEN")
    print("="*70)
    
    print(f"\nGesamt Spiele: {len(df)}")
    
    print(f"\nFamily Bereinigung:")
    print(f"  Family Source bereinigt: {(df['family_source'] != '').sum()} / {len(df)}")
    print(f"  Family ID (Integer): {integer_ids}")
    print(f"  Family ID (String/Multi): {string_ids}")
    
    print(f"\nDatenqualität:")
    print(f"  Gültige Jahre: {df['year_published'].notna().sum()} / {len(df)}")
    print(f"  Mit Min Players: {df['min_players'].notna().sum()} / {len(df)}")
    print(f"  Mit Beschreibung: {(df['description'] != '').sum()} / {len(df)}")
    print(f"  Publisher URLs (echt): {real_urls} / {len(df)}")
    print(f"  Publisher URLs (Google): {google_searches} / {len(df)}")
    
    # BEISPIEL
    print("\n" + "="*70)
    print("BEISPIEL - BEREINIGTES SPIEL")
    print("="*70)
    
    # Finde ein Multi-Family Spiel wenn möglich
    multi_family = df[df['family_id'].apply(lambda x: isinstance(x, str) and ';' in str(x))]
    if len(multi_family) > 0:
        example = multi_family.iloc[0]
        print("\n[Multi-Family Beispiel]")
    else:
        example = df.iloc[0]
        print("\n[Single-Family Beispiel]")
    
    print(f"Name: {example['name']}")
    print(f"Jahr: {example['year_published']} (Typ: {type(example['year_published']).__name__})")
    print(f"Family Source: {example['family_source']}")
    print(f"Family ID: {example['family_id']} (Typ: {type(example['family_id']).__name__})")
    print(f"Spieler: {example['min_players']}-{example['max_players']}")
    print(f"Rating: {example['average_rating']}")
    
    print("\n" + "="*70)
    print("🎉 BEREINIGUNG ABGESCHLOSSEN!")
    print("="*70)
    print("\n✅ Daten sind jetzt:")
    print("   - Korrekte Datentypen (Integer, Float, String)")
    print("   - Family Source: Bereinigte Namen")
    print("   - Family ID: Integer (single) oder String (multi)")
    print("   - Keine HTML-Tags")
    print("   - Publisher URLs oder Google Fallback")
    print("   - Bereit für Supabase Import!")
    
    return df


# ============================================================================
# AUSFÜHRUNG
# ============================================================================

if __name__ == "__main__":
    
    print("\n" + "="*70)
    print("CUSTOM FAMILY NAME MAPPING")
    print("="*70)
    print("\nAktuelle Mappings:")
    for old, new in CUSTOM_FAMILY_NAMES.items():
        print(f"  '{old}' → '{new}'")
    print("\nDu kannst weitere Mappings oben im Script hinzufügen!")
    print("="*70 + "\n")
    
    input("Drücke ENTER um zu starten...")
    
    # Bereinige die Master-Database
    df_clean = clean_bgg_database(
        input_file='bgg_ALL_SPORTS_MERGED.json',
        output_prefix='bgg_ALL_SPORTS_CLEANED'
    )
    
    print("\n📁 Bereinigte Dateien erstellt!")
    print("📊 Bereit für Supabase!")