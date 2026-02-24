"""
BGG MULTI-FAMILY MERGER - WITH FAMILY ID
Kombiniert mehrere BGG Family Scrapes und fügt Family IDs hinzu

NEUE FEATURES:
- Fügt Family ID aus Mapping hinzu (für alte Daten)
- Behält Family ID aus Scraper (für neue Daten)
- Kombiniert Family IDs bei Multi-Family Spielen
"""

import pandas as pd
import json
import glob
from datetime import datetime

# ============================================================================
# FAMILY ID MAPPING
# ============================================================================

# ============================================================================
# FAMILY ID MAPPING - KORRIGIERT (EXAKTE BGG NAMEN)
# ============================================================================

FAMILY_MAPPING = {
    # Exakte BGG Namen
    'Aerial Racing': 6973,
    'American Football': 5640,
    'Athletics / Track and Field': 5712,
    'Australian Football': 5820,
    'Auto Racing': 6206,
    'Badminton': 18684,
    'Baseball': 5586,
    'Basketball': 5574,
    'Biathlon': 37345,
    'Bicycling / Cycling': 5663,
    'Billiards / Snooker / Pool': 6949,
    'Bowling': 5700,
    'Boxing': 5839,
    'Chariot Racing': 68958,
    'Combat Sports / Martial Arts': 5786,
    'Cricket': 5706,
    'Curling': 5840,
    'Dancing': 110437,
    'Dog Sledding': 79834,
    'Equestrian': 71035,
    'Fencing': 71169,
    'Field Hockey': 71018,
    'Soccer / Football': 5551,
    'Formula 1': 72934,
    'Gaelic Football': 66520,
    'Giro dItalia': 68890,
    'Golf': 5652,
    'Greyhound Racing': 5832,
    'Horse Racing': 5730,
    'Hunting': 6096,
    'Hydroplane Racing': 112585,
    'Ice Hockey': 5628,
    'Kung Fu': 112586,
    'La Vuelta a España': 68889,
    'Motorcycle Racing': 20717,
    'Mountain Climbing': 6043,
    'Olympics': 5837,
    'Paintball': 67047,
    'Pétanque': 112371,
    'Roller Derby': 26841,
    'Rowing': 70466,
    'Rugby': 5573,
    'Sailing': 5831,
    'Skateboarding': 6496,
    'Skiing': 68282,
    'Surfing': 6497,
    'Tennis': 5626,
    'Tour de France': 66168,
    'Volleyball': 19284,
    'Winter Sports': 5732,
    'Wrestling': 5664,
    
    # Lowercase Varianten (für case-insensitive matching)
    'aerial racing': 6973,
    'american football': 5640,
    'athletics / track and field': 5712,
    'australian football': 5820,
    'auto racing': 6206,
    'badminton': 18684,
    'baseball': 5586,
    'basketball': 5574,
    'biathlon': 37345,
    'bicycling / cycling': 5663,
    'billiards / snooker / pool': 6949,
    'bowling': 5700,
    'boxing': 5839,
    'chariot racing': 68958,
    'combat sports / martial arts': 5786,
    'cricket': 5706,
    'curling': 5840,
    'dancing': 110437,
    'dog sledding': 79834,
    'equestrian': 71035,
    'fencing': 71169,
    'field hockey': 71018,
    'soccer / football': 5551,
    'formula 1': 72934,
    'gaelic football': 66520,
    'giro ditalia': 68890,
    'golf': 5652,
    'greyhound racing': 5832,
    'horse racing': 5730,
    'hunting': 6096,
    'hydroplane racing': 112585,
    'ice hockey': 5628,
    'kung fu': 112586,
    'la vuelta a españa': 68889,
    'motorcycle racing': 20717,
    'mountain climbing': 6043,
    'olympics': 5837,
    'paintball': 67047,
    'pétanque': 112371,
    'roller derby': 26841,
    'rowing': 70466,
    'rugby': 5573,
    'sailing': 5831,
    'skateboarding': 6496,
    'skiing': 68282,
    'surfing': 6497,
    'tennis': 5626,
    'tour de france': 66168,
    'volleyball': 19284,
    'winter sports': 5732,
    'wrestling': 5664,
    
    # Mögliche Variationen aus Dateinamen
    'Sports Aerial Racing': 6973,
    'Sports American Football Gridiron': 5640,
    'Sports American Football': 5640,
    'Football All 489': 5640,  # Deine alte Datei
    'Sports Athletics Track And Field': 5712,
    'Sports Australian Football': 5820,
    'Sports Auto Racing': 6206,
    'Sports Badminton': 18684,
    'Sports Baseball': 5586,
    'Sports Basketball': 5574,
    'Sports Biathlon': 37345,
    'Sports Bicycling Cycling': 5663,
    'Sports Billiards Snooker Pool': 6949,
    'Sports Bowling': 5700,
    'Sports Boxing': 5839,
    'Sports Chariot Racing': 68958,
    'Sports Combat Sports Martial Arts': 5786,
    'Sports Cricket': 5706,
    'Sports Curling': 5840,
    'Sports Dancing': 110437,
    'Sports Dog Sledding': 79834,
    'Sports Equestrian': 71035,
    'Sports Fencing': 71169,
    'Sports Field Hockey': 71018,
    'Sports Soccer Football': 5551,
    'Sports Football Soccer': 5551,
    'Sports Formula 1': 72934,
    'Sports Gaelic Football': 66520,
    'Sports Giro Ditalia': 68890,
    'Sports Golf': 5652,
    'Sports Greyhound Racing': 5832,
    'Sports Horse Racing': 5730,
    'Sports Hunting': 6096,
    'Sports Hydroplane Racing': 112585,
    'Sports Ice Hockey': 5628,
    'Sports Hockey Ice': 5628,  # Alte Variante
    'Sports Kung Fu': 112586,
    'Sports La Vuelta A España': 68889,
    'Sports Motorcycle Racing': 20717,
    'Sports Mountain Climbing': 6043,
    'Sports Olympics': 5837,
    'Sports Paintball': 67047,
    'Sports Pétanque': 112371,
    'Sports Roller Derby': 26841,
    'Sports Rowing': 70466,
    'Sports Rugby': 5573,
    'Sports Sailing': 5831,
    'Sports Skateboarding': 6496,
    'Sports Skiing': 68282,
    'Sports Surfing': 6497,
    'Sports Tennis': 5626,
    'Sports Tour De France': 66168,
    'Sports Volleyball': 19284,
    'Sports Winter Sports': 5732,
    'Sports Wrestling': 5664,
}


def get_family_id(family_name):
    """Konvertiert Family-Name zu Family-ID"""
    
    if not family_name:
        return None
    
    # Versuche exakte Übereinstimmung
    if family_name in FAMILY_MAPPING:
        return FAMILY_MAPPING[family_name]
    
    # Versuche lowercase
    lower_name = family_name.lower()
    if lower_name in FAMILY_MAPPING:
        return FAMILY_MAPPING[lower_name]
    
    # Versuche ohne Sonderzeichen
    clean_name = family_name.replace('_', ' ').strip()
    if clean_name in FAMILY_MAPPING:
        return FAMILY_MAPPING[clean_name]
    
    # Fallback: None
    print(f"  ⚠️ Keine Family ID für: '{family_name}'")
    return None


# ============================================================================
# FUNKTION: FINDE ALLE COMPLETE FILES
# ============================================================================

def find_complete_files():
    """Findet alle *_COMPLETE.json Files"""
    
    json_files = glob.glob('*_COMPLETE.json')
    
    print("="*70)
    print("BGG MULTI-FAMILY MERGER (WITH FAMILY ID)")
    print("="*70 + "\n")
    
    print(f"Gefundene COMPLETE Files: {len(json_files)}\n")
    
    for i, file in enumerate(json_files, 1):
        print(f"  {i}. {file}")
    
    return json_files


# ============================================================================
# FUNKTION: LADE UND KOMBINIERE
# ============================================================================

def merge_all_families(json_files):
    """Lädt alle JSON Files und fügt Family IDs hinzu"""
    
    print("\n" + "="*70)
    print("LADE UND KOMBINIERE DATEN")
    print("="*70 + "\n")
    
    all_games = []
    stats_per_family = []
    
    for json_file in json_files:
        print(f"Lade {json_file}...", end=' ')
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                games = json.load(f)
            
            # Extrahiere Family-Name aus Dateinamen
            family_name = json_file.replace('bgg_', '').replace('_COMPLETE.json', '').replace('_', ' ').title()
            
            # Hole Family ID aus Mapping
            family_id = get_family_id(family_name)
            
            # Füge zu jedem Spiel hinzu
            for game in games:
                game['family_source'] = family_name
                
                # NEU: Füge Family ID hinzu (falls noch nicht vorhanden)
                if 'family_id' not in game or game['family_id'] is None:
                    game['family_id'] = family_id
                # Konvertiere zu String für späteres Kombinieren
                if game['family_id'] is not None:
                    game['family_id'] = str(game['family_id'])
            
            all_games.extend(games)
            
            stats_per_family.append({
                'family': family_name,
                'file': json_file,
                'games': len(games),
                'family_id': family_id
            })
            
            print(f"✓ {len(games)} Spiele (Family ID: {family_id})")
            
        except Exception as e:
            print(f"✗ Fehler: {e}")
    
    print(f"\n{'='*70}")
    print(f"GESAMT GELADEN: {len(all_games)} Einträge")
    print(f"{'='*70}\n")
    
    return all_games, stats_per_family


# ============================================================================
# FUNKTION: KOMBINIERE FAMILIES (MIT FAMILY ID)
# ============================================================================

def combine_families(all_games):
    """Kombiniert Spiele und ihre Family IDs"""
    
    print("="*70)
    print("KOMBINIERE MULTI-FAMILY SPIELE")
    print("="*70 + "\n")
    
    df = pd.DataFrame(all_games)
    
    print(f"Vor Kombinierung: {len(df)} Einträge")
    
    # Finde Duplikate
    duplicates = df[df.duplicated(subset=['bgg_id'], keep=False)]
    
    if len(duplicates) > 0:
        unique_dupes = duplicates['bgg_id'].nunique()
        print(f"Spiele in mehreren Families: {unique_dupes}\n")
        
        print("Multi-Family Spiele:")
        for bgg_id in duplicates['bgg_id'].unique():
            dup_games = df[df['bgg_id'] == bgg_id]
            families = dup_games['family_source'].tolist()
            family_ids = dup_games['family_id'].tolist()
            print(f"  BGG ID {bgg_id}: {dup_games.iloc[0]['name']}")
            print(f"    Families: {', '.join(families)}")
            print(f"    Family IDs: {', '.join([str(fid) for fid in family_ids if fid])}")
    else:
        print("✓ Keine Multi-Family Spiele\n")
    
    # Kombiniere
    print("\nKombiniere Families und Family IDs...")
    
    agg_dict = {
        'family_source': lambda x: '; '.join(sorted(set(x))),
        'family_id': lambda x: '; '.join(sorted(set(str(f) for f in x if f and str(f) != 'None'))),  # ← NEU!
    }
    
    # Alle anderen Felder
    other_fields = [col for col in df.columns if col not in ['bgg_id', 'family_source', 'family_id']]
    for field in other_fields:
        agg_dict[field] = 'first'
    
    df_combined = df.groupby('bgg_id', as_index=False).agg(agg_dict)
    
    # Bereinige leere family_id
    df_combined['family_id'] = df_combined['family_id'].replace('', None)
    
    print(f"\n{'='*70}")
    print(f"Nach Kombinierung: {len(df_combined)} eindeutige Spiele")
    print(f"{'='*70}\n")
    
    return df_combined


# ============================================================================
# FUNKTION: STATISTIKEN
# ============================================================================

def create_family_stats(df):
    """Statistiken über Family-Zugehörigkeiten"""
    
    print("="*70)
    print("FAMILY-STATISTIKEN")
    print("="*70 + "\n")
    
    # Spiele mit Family ID
    with_id = df[df['family_id'].notna()]
    without_id = df[df['family_id'].isna()]
    
    print(f"Spiele MIT Family ID: {len(with_id)}")
    print(f"Spiele OHNE Family ID: {len(without_id)}\n")
    
    if len(without_id) > 0:
        print("⚠️ Spiele ohne Family ID:")
        for idx, row in without_id.head(10).iterrows():
            print(f"  {row['name'][:50]:50s} (Family: {row['family_source']})")
    
    # Multi-Family
    multi_family = df[df['family_source'].str.contains(';', na=False)]
    
    print(f"\nSpiele in MEHREREN Families: {len(multi_family)}\n")
    
    if len(multi_family) > 0:
        print("Multi-Family Spiele:")
        for idx, row in multi_family.iterrows():
            print(f"  {row['name'][:40]:40s}")
            print(f"    Families: {row['family_source']}")
            print(f"    IDs:      {row['family_id']}")
    
    return multi_family


# ============================================================================
# FUNKTION: SPEICHERN
# ============================================================================

def save_merged_data(df_combined, stats_per_family):
    """Speichert die Daten"""
    
    print("\n" + "="*70)
    print("SPEICHERE FINALE DATEIEN")
    print("="*70 + "\n")
    
    main_prefix = 'bgg_ALL_SPORTS_MERGED'
    
    csv_file = f'{main_prefix}.csv'
    excel_file = f'{main_prefix}.xlsx'
    json_file = f'{main_prefix}.json'
    
    df_combined.to_csv(csv_file, index=False, encoding='utf-8')
    df_combined.to_excel(excel_file, index=False, engine='openpyxl')
    
    json_data = df_combined.to_dict(orient='records')
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, indent=2, ensure_ascii=False)
    
    print(f"✓ {csv_file}")
    print(f"✓ {excel_file}")
    print(f"✓ {json_file}")
    
    # Report
    report_file = 'bgg_MERGE_REPORT.txt'
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("="*70 + "\n")
        f.write("BGG MULTI-FAMILY MERGE REPORT (WITH FAMILY ID)\n")
        f.write("="*70 + "\n\n")
        
        f.write(f"Datum: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        f.write("QUELL-FAMILIES:\n")
        f.write("-"*70 + "\n")
        for stat in stats_per_family:
            f.write(f"  {stat['family']:30s}: {stat['games']:4d} Spiele (ID: {stat['family_id']}, {stat['file']})\n")
        
        f.write(f"\nEindeutige Spiele: {len(df_combined)}\n\n")
        
        f.write("FAMILY ID COVERAGE:\n")
        f.write("-"*70 + "\n")
        with_id = df_combined[df_combined['family_id'].notna()]
        f.write(f"Mit Family ID: {len(with_id)}/{len(df_combined)}\n")
        
        multi_family = df_combined[df_combined['family_source'].str.contains(';', na=False)]
        f.write(f"\nSPIELE IN MEHREREN FAMILIES: {len(multi_family)}\n")
        f.write("-"*70 + "\n")
        for idx, row in multi_family.iterrows():
            f.write(f"{row['name'][:50]:50s}\n")
            f.write(f"  Families: {row['family_source']}\n")
            f.write(f"  IDs:      {row['family_id']}\n\n")
    
    print(f"✓ {report_file}")


# ============================================================================
# HAUPTPROGRAMM
# ============================================================================

def main():
    """Hauptfunktion"""
    
    json_files = find_complete_files()
    
    if not json_files:
        print("\n✗ Keine *_COMPLETE.json Files gefunden!")
        return
    
    all_games, stats_per_family = merge_all_families(json_files)
    
    if not all_games:
        print("\n✗ Keine Daten geladen!")
        return
    
    df_combined = combine_families(all_games)
    
    multi_family = create_family_stats(df_combined)
    
    save_merged_data(df_combined, stats_per_family)
    
    print(f"\n{'='*70}")
    print("FINALE STATISTIKEN")
    print(f"{'='*70}")
    print(f"Families kombiniert: {len(json_files)}")
    print(f"Eindeutige Spiele: {len(df_combined)}")
    print(f"Mit Family ID: {df_combined['family_id'].notna().sum()}")
    print(f"Multi-Family Spiele: {len(multi_family)}")
    
    print(f"\n{'='*70}")
    print("🎉 MERGE ABGESCHLOSSEN!")
    print(f"{'='*70}")
    print("\n✅ Alle Spiele haben jetzt family_id Feld!")
    print("✅ Multi-Family Spiele: family_id = '5640; 5839'")
    print("\n💡 Frontend Usage:")
    print("   const ids = game.family_id.split(';').map(id => id.trim());")
    print(f"\n{'='*70}\n")
    
    return df_combined


# ============================================================================
# AUSFÜHRUNG
# ============================================================================

if __name__ == "__main__":
    df_merged = main()