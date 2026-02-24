"""
BGG INCREMENTAL UPDATER - FIXED
Aktualisiert die Master-Database mit neuen Spielen

FIXES:
- Fehler 1: Family ID wird durchgereicht ✓
- Fehler 2: Family Source wird gesetzt ✓
- Fehler 7: Failed IDs werden gespeichert ✓
"""

import requests
import pandas as pd
import json
import re
import os
from time import sleep
from datetime import datetime
import glob

# ============================================================================
# SCRAPER KLASSEN (MIT FAMILY ID SUPPORT)
# ============================================================================

class BGGFamilyFinder:
    """Findet alle Spiele in einer BGG Family"""
    
    def __init__(self):
        self.base_url = "https://api.geekdo.com/api/geekitem/linkeditems"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Accept': 'application/json, text/plain, */*'
        }
    
    def get_all_games(self, family_id):
        """Holt alle Spiel-IDs aus einer Family"""
        
        all_games = []
        page = 1
        items_per_page = 50
        
        while True:
            params = {
                'ajax': 1,
                'linkdata_index': 'boardgame',
                'nosession': 1,
                'objectid': family_id,
                'objecttype': 'family',
                'pageid': page,
                'showcount': items_per_page,
                'sort': 'name',
                'subtype': 'boardgamefamily'
            }
            
            try:
                response = requests.get(self.base_url, params=params, 
                                       headers=self.headers, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'items' in data and data['items']:
                        items = data['items']
                        
                        for item in items:
                            all_games.append({
                                'bgg_id': int(item.get('objectid', 0)),
                                'name': item.get('name', 'Unknown'),
                                'year_published': item.get('yearpublished', ''),
                                'family_id': family_id
                            })
                        
                        if len(items) < items_per_page:
                            break
                        
                        page += 1
                        sleep(0.5)
                    else:
                        break
                else:
                    break
                    
            except Exception as e:
                print(f"    Fehler: {e}")
                break
        
        return all_games


class BGGDetailScraper:
    """Scraped detaillierte Informationen"""
    
    def __init__(self, delay_seconds=3):
        self.delay = delay_seconds
        self.base_url = "https://boardgamegeek.com/boardgame"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
    
    def scrape_game(self, game_id):
        """Scraped ein einzelnes Spiel"""
        
        url = f"{self.base_url}/{game_id}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            
            if response.status_code == 200:
                json_match = re.search(r'GEEK\.geekitemPreload\s*=\s*({.*?});', 
                                      response.text, re.DOTALL)
                
                if json_match:
                    return json.loads(json_match.group(1))
                    
            elif response.status_code == 429:
                sleep(30)
                return self.scrape_game(game_id)
                
            return None
                
        except:
            return None
    
    def extract_complete_info(self, raw_data, family_id=None):
        """Extrahiert ALLE Felder (MIT FAMILY ID)"""
        
        item = raw_data['item']
        
        game_info = {
            'bgg_id': item['id'],
            'name': item['name'],
            'year_published': item['yearpublished'],
            'description': item['description'],
            'short_description': item.get('short_description', ''),
            'family_id': family_id,  # ← FIX 1: Family ID
            'min_players': item['minplayers'],
            'max_players': item['maxplayers'],
            'min_playtime': item['minplaytime'],
            'max_playtime': item['maxplaytime'],
            'min_age': item['minage'],
            'average_rating': float(item['stats']['average']),
            'bayes_average': float(item['stats']['baverage']),
            'users_rated': int(item['stats']['usersrated']),
            'num_owned': int(item['stats']['numowned']),
            'num_wanting': int(item['stats']['numwanting']),
            'num_wishing': int(item['stats']['numwish']),
            'complexity_weight': float(item['stats']['avgweight']),
            'num_plays': int(item['stats']['numplays']),
            'overall_rank': None,
            'thematic_rank': None,
            'strategy_rank': None,
            'bgg_url': item['canonical_link'],
            'image_url': item['imageurl'],
            'thumbnail_url': item['images'].get('thumb', '') if 'images' in item else '',
            'top_image_url': item.get('topimageurl', ''),
            'image_page_href': item.get('imagepagehref', ''),
            'publisher_website': '',
            'publisher_website_title': '',
            'best_player_count_min': None,
            'best_player_count_max': None,
            'recommended_player_count_min': None,
            'recommended_player_count_max': None,
            'categories': '',
            'mechanics': '',
            'families': '',
            'designers': '',
            'publishers': '',
            'subdomains': '',
            'artists': '',
            'developers': '',
            'graphic_designers': '',
            'sculptors': '',
            'editors': '',
            'writers': '',
            'reimplementations': '',
        }
        
        # Rankings
        for rank in item['rankinfo']:
            if rank['rankobjectid'] == 1:
                game_info['overall_rank'] = rank['rank'] if rank['rank'] != 'Not Ranked' else None
            elif rank.get('subdomain') == 'thematic':
                game_info['thematic_rank'] = rank['rank'] if rank['rank'] != 'Not Ranked' else None
            elif rank.get('subdomain') == 'strategygames':
                game_info['strategy_rank'] = rank['rank'] if rank['rank'] != 'Not Ranked' else None
        
        # Website
        if 'website' in item and item['website']:
            game_info['publisher_website'] = item['website'].get('url', '')
            game_info['publisher_website_title'] = item['website'].get('title', '')
        
        # Polls
        if 'polls' in item and 'userplayers' in item['polls']:
            userplayers = item['polls']['userplayers']
            if 'best' in userplayers and userplayers['best']:
                best = userplayers['best'][0]
                game_info['best_player_count_min'] = best.get('min')
                game_info['best_player_count_max'] = best.get('max')
            if 'recommended' in userplayers and userplayers['recommended']:
                rec = userplayers['recommended'][0]
                game_info['recommended_player_count_min'] = rec.get('min')
                game_info['recommended_player_count_max'] = rec.get('max')
        
        # Links
        links = item['links']
        if links.get('boardgamecategory'):
            game_info['categories'] = '; '.join([c['name'] for c in links['boardgamecategory']])
        if links.get('boardgamemechanic'):
            game_info['mechanics'] = '; '.join([m['name'] for m in links['boardgamemechanic']])
        if links.get('boardgamefamily'):
            game_info['families'] = '; '.join([f['name'] for f in links['boardgamefamily']])
        if links.get('boardgamedesigner'):
            game_info['designers'] = '; '.join([d['name'] for d in links['boardgamedesigner']])
        if links.get('boardgamepublisher'):
            game_info['publishers'] = '; '.join([p['name'] for p in links['boardgamepublisher']])
        if links.get('boardgamesubdomain'):
            game_info['subdomains'] = '; '.join([s['name'] for s in links['boardgamesubdomain']])
        if links.get('boardgameartist'):
            game_info['artists'] = '; '.join([a['name'] for a in links['boardgameartist']])
        if links.get('boardgamedeveloper'):
            game_info['developers'] = '; '.join([d['name'] for d in links['boardgamedeveloper']])
        if links.get('boardgamegraphicdesigner'):
            game_info['graphic_designers'] = '; '.join([g['name'] for g in links['boardgamegraphicdesigner']])
        if links.get('boardgamesculptor'):
            game_info['sculptors'] = '; '.join([s['name'] for s in links['boardgamesculptor']])
        if links.get('boardgameeditor'):
            game_info['editors'] = '; '.join([e['name'] for e in links['boardgameeditor']])
        if links.get('boardgamewriter'):
            game_info['writers'] = '; '.join([w['name'] for w in links['boardgamewriter']])
        if links.get('reimplementation'):
            game_info['reimplementations'] = '; '.join([r['name'] for r in links['reimplementation']])
        
        return game_info


# ============================================================================
# FAMILY MAPPING (FÜR FAMILY SOURCE)
# ============================================================================

FAMILY_ID_TO_NAME = {
    # Alle exakten BGG Family Namen
    6973: 'Aerial Racing',
    5640: 'American Football',
    5712: 'Athletics / Track and Field',
    5820: 'Australian Football',
    6206: 'Auto Racing',
    18684: 'Badminton',
    5586: 'Baseball',
    5574: 'Basketball',
    37345: 'Biathlon',
    5663: 'Bicycling / Cycling',
    6949: 'Billiards / Snooker / Pool',
    5700: 'Bowling',
    5839: 'Boxing',
    68958: 'Chariot Racing',
    5786: 'Combat Sports / Martial Arts',
    5706: 'Cricket',
    5840: 'Curling',
    110437: 'Dancing',
    79834: 'Dog Sledding',
    71035: 'Equestrian',
    71169: 'Fencing',
    71018: 'Field Hockey',
    5551: 'Soccer / Football',
    72934: 'Formula 1',
    66520: 'Gaelic Football',
    68890: 'Giro dItalia',
    5652: 'Golf',
    5832: 'Greyhound Racing',
    5730: 'Horse Racing',
    6096: 'Hunting',
    112585: 'Hydroplane Racing',
    5628: 'Ice Hockey',
    112586: 'Kung Fu',
    68889: 'La Vuelta a España',
    20717: 'Motorcycle Racing',
    6043: 'Mountain Climbing',
    5837: 'Olympics',
    67047: 'Paintball',
    112371: 'Pétanque',
    26841: 'Roller Derby',
    70466: 'Rowing',
    5573: 'Rugby',
    5831: 'Sailing',
    6496: 'Skateboarding',
    68282: 'Skiing',
    6497: 'Surfing',
    5626: 'Tennis',
    66168: 'Tour de France',
    19284: 'Volleyball',
    5732: 'Winter Sports',
    5664: 'Wrestling',
}


# ============================================================================
# MASTER DATABASE LADEN
# ============================================================================

def load_master_database():
    """Lädt die existierende Master-Database"""
    
    master_file = 'bgg_ALL_SPORTS_MERGED.json'
    
    if os.path.exists(master_file):
        print(f"✓ Master-Database gefunden: {master_file}")
        
        with open(master_file, 'r', encoding='utf-8') as f:
            existing_games = json.load(f)
        
        # FIX 9: Konvertiere ALLE IDs zu Integer
        existing_ids = set()
        for game in existing_games:
            try:
                game_id = int(game['bgg_id'])
                game['bgg_id'] = game_id
                existing_ids.add(game_id)
            except:
                pass
        
        print(f"  Existierende Spiele: {len(existing_games)}")
        print(f"  Existierende IDs: {len(existing_ids)}")
        
        return existing_games, existing_ids
    else:
        print("⚠ Keine Master-Database gefunden - erstelle neue")
        return [], set()


def get_family_name(family_id):
    """Holt Family-Name von BGG"""
    
    # FIX 2: Erst Mapping checken
    if family_id in FAMILY_ID_TO_NAME:
        return FAMILY_ID_TO_NAME[family_id]
    
    try:
        url = f"https://boardgamegeek.com/boardgamefamily/{family_id}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            title_match = re.search(r'<title>([^|]+)', response.text)
            if title_match:
                name = title_match.group(1).strip()
                name = name.replace(' | Board Game Family | BoardGameGeek', '')
                name = re.sub(r'[<>:"/\\|?*]', '', name).strip()
                return name
        
        return f"Family_{family_id}"
    except:
        return f"Family_{family_id}"


# ============================================================================
# INCREMENTAL UPDATE (GEFIXT)
# ============================================================================

def incremental_update(family_ids, delay=3):
    """
    Führt Incremental Update durch
    
    FIXES:
    - Family ID wird durchgereicht (Fehler 1)
    - Family Source wird gesetzt (Fehler 2)
    - Failed IDs werden gespeichert (Fehler 7)
    """
    
    print("="*70)
    print("BGG INCREMENTAL UPDATER - FIXED")
    print("="*70)
    print(f"Families zum Updaten: {len(family_ids)}")
    print(f"Delay: {delay} Sekunden")
    print("="*70 + "\n")
    
    # 1. Lade existierende Database
    print("SCHRITT 1: LADE EXISTIERENDE DATABASE")
    print("-"*70)
    existing_games, existing_ids = load_master_database()
    
    # 2. Finde alle Spiele in Families
    print("\n" + "="*70)
    print("SCHRITT 2: FINDE SPIELE IN FAMILIES")
    print("="*70 + "\n")
    
    finder = BGGFamilyFinder()
    all_family_games = {}
    all_ids_in_families = set()
    
    for family_id in family_ids:
        family_name = get_family_name(family_id)
        print(f"Family {family_id} ({family_name})...", end=' ')
        
        games = finder.get_all_games(family_id)
        all_family_games[family_id] = {
            'name': family_name,
            'games': games,
            'ids': set(g['bgg_id'] for g in games)
        }
        all_ids_in_families.update(all_family_games[family_id]['ids'])
        
        print(f"✓ {len(games)} Spiele")
    
    # 3. Identifiziere neue Spiele
    print("\n" + "="*70)
    print("SCHRITT 3: IDENTIFIZIERE NEUE SPIELE")
    print("="*70 + "\n")
    
    new_ids = all_ids_in_families - existing_ids
    
    print(f"Spiele in Families: {len(all_ids_in_families)}")
    print(f"Bereits in Database: {len(existing_ids)}")
    print(f"NEU zu scrapen: {len(new_ids)}")
    
    if not new_ids:
        print("\n✓ Keine neuen Spiele! Database ist aktuell.")
        return existing_games
    
    # 4. Scrape nur neue Spiele (MIT FAMILY ID & SOURCE!)
    print("\n" + "="*70)
    print("SCHRITT 4: SCRAPE NEUE SPIELE")
    print("="*70 + "\n")
    
    scraper = BGGDetailScraper(delay_seconds=delay)
    new_games = []
    all_failed = []  # FIX 7: Track failed IDs
    
    for i, game_id in enumerate(sorted(new_ids), 1):
        print(f"  [{i}/{len(new_ids)}] BGG ID {game_id}...", end=' ')
        
        raw_data = scraper.scrape_game(game_id)
        
        if raw_data:
            # FIX 1 & 2: Finde Family ID & Name für dieses Spiel
            game_family_id = None
            game_family_name = None
            
            for fid, fdata in all_family_games.items():
                if game_id in fdata['ids']:
                    game_family_id = fid
                    game_family_name = fdata['name']
                    break
            
            # Extract mit Family ID
            game_info = scraper.extract_complete_info(
                raw_data,
                family_id=game_family_id  # ← FIX 1: Family ID durchreichen!
            )
            
            # FIX 2: Family Source setzen
            game_info['family_source'] = game_family_name
            
            # FIX 4: Neues scraped_at Datum
            game_info['scraped_at'] = datetime.now().isoformat()
            game_info['added_in_update'] = datetime.now().strftime('%Y-%m-%d')
            
            new_games.append(game_info)
            print("✓")
        else:
            all_failed.append(game_id)  # FIX 7: Track failed
            print("✗")
        
        if i < len(new_ids):
            sleep(delay)
    
    # FIX 7: Speichere failed IDs
    if all_failed:
        failed_file = f'failed_ids_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
        with open(failed_file, 'w') as f:
            f.write(f"Failed IDs ({len(all_failed)}):\n")
            f.write('\n'.join(str(id) for id in all_failed))
        
        print(f"\n⚠️ {len(all_failed)} Spiele fehlgeschlagen!")
        print(f"→ Gespeichert in: {failed_file}")
    
    # 5. Merge mit existierenden Daten
    print("\n" + "="*70)
    print("SCHRITT 5: MERGE MIT BESTEHENDEN DATEN")
    print("="*70 + "\n")
    
    updated_games = existing_games + new_games
    
    print(f"Vorher: {len(existing_games)} Spiele")
    print(f"Neu hinzugefügt: {len(new_games)} Spiele")
    print(f"Fehlgeschlagen: {len(all_failed)} Spiele")
    print(f"Nachher: {len(updated_games)} Spiele")
    
    # 6. Backup & Speichern
    print("\n" + "="*70)
    print("SCHRITT 6: BACKUP & SPEICHERN")
    print("="*70 + "\n")
    
    # Backup
    if existing_games:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'bgg_ALL_SPORTS_MERGED_BACKUP_{timestamp}.json'
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(existing_games, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Backup erstellt: {backup_file}")
    
    # Speichere neue Master-Database
    df_updated = pd.DataFrame(updated_games)
    
    df_updated.to_json('bgg_ALL_SPORTS_MERGED.json', orient='records', indent=2, force_ascii=False)
    df_updated.to_excel('bgg_ALL_SPORTS_MERGED.xlsx', index=False, engine='openpyxl')
    df_updated.to_csv('bgg_ALL_SPORTS_MERGED.csv', index=False, encoding='utf-8')
    
    print(f"✓ bgg_ALL_SPORTS_MERGED.json")
    print(f"✓ bgg_ALL_SPORTS_MERGED.xlsx")
    print(f"✓ bgg_ALL_SPORTS_MERGED.csv")
    
    # Update-Report
    report_file = f'UPDATE_REPORT_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("="*70 + "\n")
        f.write("INCREMENTAL UPDATE REPORT\n")
        f.write("="*70 + "\n\n")
        f.write(f"Datum: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Families geupdatet: {len(family_ids)}\n")
        for fid in family_ids:
            f.write(f"  - {fid}: {all_family_games[fid]['name']}\n")
        f.write(f"\nVorher: {len(existing_games)} Spiele\n")
        f.write(f"Neu hinzugefügt: {len(new_games)} Spiele\n")
        f.write(f"Fehlgeschlagen: {len(all_failed)} Spiele\n")
        f.write(f"Nachher: {len(updated_games)} Spiele\n\n")
        f.write("NEUE SPIELE:\n")
        f.write("-"*70 + "\n")
        for game in new_games:
            f.write(f"  {int(game['bgg_id']):6d} - {game['name']} (Family: {game['family_source']})\n")
        
        if all_failed:
            f.write(f"\nFEHLGESCHLAGENE IDs:\n")
            f.write("-"*70 + "\n")
            for fid in all_failed:
                f.write(f"  {fid}\n")
    
    print(f"✓ {report_file}")
    
    print("\n" + "="*70)
    print("🎉 UPDATE ABGESCHLOSSEN!")
    print("="*70)
    print("\n⚠️ WICHTIG: Führe jetzt den DATA CLEANER aus!")
    print("   python BGG_DATA_CLEANER_COMPLETE.py")
    
    return updated_games


# ============================================================================
# AUSFÜHRUNG
# ============================================================================

if __name__ == "__main__":
    
    # ========================================================================
    # KONFIGURATION
    # ========================================================================
    
    FAMILY_IDS = [
      
        6973,   # Aerial Racing
        5640,   # American Football
        5712,   # Athletics / Track and Field
        5820,   # Australian Football
        6206,   # Auto Racing
        18684,  # Badminton
        5586,   # Baseball
        5574,   # Basketball
        37345,  # Biathlon
        5663,   # Bicycling / Cycling
        6949,   # Billiards / Snooker / Pool
        5700,   # Bowling
        5839,   # Boxing
        68958,  # Chariot Racing
        5786,   # Combat Sports / Martial Arts
        5706,   # Cricket
        5840,   # Curling
        110437, # Dancing
        79834,  # Dog Sledding
        71035,  # Equestrian
        71169,  # Fencing
        71018,  # Field Hockey
        5551,   # Soccer / Football
        72934,  # Formula 1
        66520,  # Gaelic Football
        68890,  # Giro d'Italia
        5652,   # Golf
        5832,   # Greyhound Racing
        5730,   # Horse Racing
        6096,   # Hunting
        112585, # Hydroplane Racing
        5628,   # Ice Hockey
        112586, # Kung Fu
        68889,  # La Vuelta a España
        20717,  # Motorcycle Racing
        6043,   # Mountain Climbing
        5837,   # Olympics
        67047,  # Paintball
        112371, # Pétanque
        26841,  # Roller Derby
        70466,  # Rowing
        5573,   # Rugby
        5831,   # Sailing
        6496,   # Skateboarding
        68282,  # Skiing
        6497,   # Surfing
        5626,   # Tennis
        66168,  # Tour de France
        19284,  # Volleyball
        5732,   # Winter Sports
        5664,   # Wrestling    
        
        # Füge weitere hinzu
    ]
    
    DELAY = 3
    
    # ========================================================================
    # STARTE UPDATE
    # ========================================================================
    
    updated_games = incremental_update(FAMILY_IDS, delay=DELAY)
    
    print(f"\n📁 Master-Database aktualisiert!")
    print(f"📊 Gesamt: {len(updated_games)} Spiele")
    print(f"\n⚠️ NÄCHSTER SCHRITT:")
    print(f"   python BGG_DATA_CLEANER_COMPLETE.py")