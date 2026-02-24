"""
BGG FAMILY SCRAPER - WITH FAMILY ID
Scraped alle Spiele aus einer BGG Family und speichert die Family ID mit

NEUE FEATURES:
- Family ID wird automatisch mitgespeichert
- Jedes Spiel hat 'family_id' Feld
"""

import requests
import pandas as pd
import json
import re
from time import sleep
from datetime import datetime
import html

# ============================================================================
# HTML CLEANING (NEU!)
# ============================================================================

def clean_description_for_excel(text):
    """
    Entfernt HTML-Tags und illegale Zeichen für Excel
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
    
    # Control Characters entfernen (illegale Zeichen für Excel!)
    # ASCII 0-31 außer Tab (9), LF (10), CR (13)
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\t\n\r')
    
    # Mehrfache Zeilenumbrüche normalisieren
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    
    # Whitespaces pro Zeile
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)
    
    # Mehrfache Leerzeichen
    text = re.sub(r' +', ' ', text)
    
    return text.strip()

# ============================================================================
# KLASSE 1: BGG FAMILY FINDER (MIT FAMILY ID)
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
                                'family_id': family_id  # ← NEU! Family ID wird mitgespeichert
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


# ============================================================================
# KLASSE 2: BGG DETAIL SCRAPER (MIT FAMILY ID)
# ============================================================================

class BGGDetailScraper:
    """Scraped detaillierte Informationen für Spiele"""
    
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
    
    def extract_complete_info(self, raw_data, family_id=None):  # ← NEU! Parameter hinzugefügt
        """Extrahiert ALLE Felder aus Roh-JSON"""
        
        item = raw_data['item']
        
        game_info = {
            # Basic Info
            'bgg_id': item['id'],
            'name': item['name'],
            'year_published': item['yearpublished'],
            'description': clean_description_for_excel(item['description']),  # ← FIX!
            'short_description': clean_description_for_excel(item.get('short_description', '')),  # ← FIX!
            
            # ← NEU! Family ID wird mitgespeichert
            'family_id': family_id,
            
            # Spieler & Zeit
            'min_players': item['minplayers'],
            'max_players': item['maxplayers'],
            'min_playtime': item['minplaytime'],
            'max_playtime': item['maxplaytime'],
            'min_age': item['minage'],
            
            # Ratings
            'average_rating': float(item['stats']['average']),
            'bayes_average': float(item['stats']['baverage']),
            'users_rated': int(item['stats']['usersrated']),
            'num_owned': int(item['stats']['numowned']),
            'num_wanting': int(item['stats']['numwanting']),
            'num_wishing': int(item['stats']['numwish']),
            'complexity_weight': float(item['stats']['avgweight']),
            'num_plays': int(item['stats']['numplays']),
            
            # Rankings
            'overall_rank': None,
            'thematic_rank': None,
            'strategy_rank': None,
            
            # URLs & Images
            'bgg_url': item['canonical_link'],
            'image_url': item['imageurl'],
            'thumbnail_url': item['images'].get('thumb', '') if 'images' in item else '',
            'top_image_url': item.get('topimageurl', ''),
            'image_page_href': item.get('imagepagehref', ''),
            
            # Publisher Website
            'publisher_website': '',
            'publisher_website_title': '',
            
            # Best Player Count
            'best_player_count_min': None,
            'best_player_count_max': None,
            'recommended_player_count_min': None,
            'recommended_player_count_max': None,
            
            # Listen - Standard
            'categories': '',
            'mechanics': '',
            'families': '',
            'designers': '',
            'publishers': '',
            'subdomains': '',
            
            # Listen - Credits
            'artists': '',
            'developers': '',
            'graphic_designers': '',
            'sculptors': '',
            'editors': '',
            'writers': '',
            
            # Beziehungen
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
# HILFSFUNKTION: FAMILY NAME AUTOMATISCH HOLEN
# ============================================================================

def get_family_name(family_id):
    """Holt den Family-Namen automatisch von BGG"""
    
    print("Hole Family-Informationen von BGG...")
    
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
                print(f"✓ Family gefunden: {name}\n")
                return name
        
        return f"Family_{family_id}"
    except:
        return f"Family_{family_id}"


# ============================================================================
# HAUPTFUNKTION: KOMPLETTER SCRAPE-PROZESS (MIT FAMILY ID)
# ============================================================================

def scrape_bgg_family(family_id, family_name, batch_size=50, delay=3):
    """Kompletter Scrape-Prozess für eine BGG Family"""
    
    print("\n" + "="*70)
    print("BGG FAMILY SCRAPER (WITH FAMILY ID)")
    print("="*70)
    print(f"Family: {family_name}")
    print(f"Family ID: {family_id}")  # ← NEU! Wird angezeigt
    print(f"Batch Size: {batch_size}")
    print(f"Delay: {delay} Sekunden")
    print("="*70 + "\n")
    
    # SCHRITT 1: Finde alle Spiele
    print("SCHRITT 1: SPIELE FINDEN")
    print("-"*70)
    
    finder = BGGFamilyFinder()
    games = finder.get_all_games(family_id)  # ← Family ID wird durchgereicht
    
    if not games:
        print("✗ Keine Spiele gefunden!")
        return
    
    print(f"✓ {len(games)} Spiele gefunden (alle haben family_id={family_id})\n")
    
    # Speichere Liste
    df_list = pd.DataFrame(games)
    list_file = f'bgg_{family_name.lower().replace(" ", "_")}_list.xlsx'
    df_list.to_excel(list_file, index=False, engine='openpyxl')
    print(f"✓ Spiele-Liste gespeichert: {list_file}\n")
    
    # SCHRITT 2: Scrape Details
    print("SCHRITT 2: DETAILS SCRAPEN")
    print("-"*70)
    
    scraper = BGGDetailScraper(delay_seconds=delay)
    
    all_ids = [g['bgg_id'] for g in games]
    num_batches = (len(all_ids) // batch_size) + (1 if len(all_ids) % batch_size > 0 else 0)
    
    all_results = []
    
    for batch_num in range(num_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(all_ids))
        batch_ids = all_ids[start_idx:end_idx]
        
        print(f"\nBATCH {batch_num + 1}/{num_batches}")
        print(f"Spiele {start_idx + 1} - {end_idx}")
        print("-"*70 + "\n")
        
        for i, game_id in enumerate(batch_ids, 1):
            print(f"  [{i}/{len(batch_ids)}] BGG ID {game_id}...", end=' ')
            
            raw_data = scraper.scrape_game(game_id)
            
            if raw_data:
                all_results.append({
                    'bgg_id': game_id,
                    'data': raw_data,
                    'scraped_at': datetime.now().isoformat()
                })
                print("✓")
            else:
                print("✗")
            
            if i < len(batch_ids):
                sleep(delay)
        
        # Speichere Batch
        batch_file = f'bgg_{family_name.lower().replace(" ", "_")}_batch_{batch_num+1}_raw.json'
        with open(batch_file, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, indent=2, ensure_ascii=False)
        
        if batch_num < num_batches - 1:
            print(f"\n  ⏸ Pause 10 Sekunden...\n")
            sleep(10)
    
    # SCHRITT 3: Verarbeite Ergebnisse
    print("\n" + "="*70)
    print("SCHRITT 3: DATEN VERARBEITEN")
    print("="*70 + "\n")
    
    games_complete = []
    
    for result in all_results:
        try:
            game_info = scraper.extract_complete_info(
                result['data'],
                family_id=family_id  # ← NEU! Family ID wird durchgereicht
            )
            game_info['scraped_at'] = result['scraped_at']
            games_complete.append(game_info)
        except Exception as e:
            print(f"✗ Fehler bei BGG ID {result['bgg_id']}: {e}")
    
    # SCHRITT 4: Speichern
    print("\n" + "="*70)
    print("SCHRITT 4: FINALE DATEIEN SPEICHERN")
    print("="*70 + "\n")
    
    df_final = pd.DataFrame(games_complete)
    
    prefix = f'bgg_{family_name.lower().replace(" ", "_")}_COMPLETE'
    
    csv_file = f'{prefix}.csv'
    excel_file = f'{prefix}.xlsx'
    json_file = f'{prefix}.json'
    
    df_final.to_csv(csv_file, index=False, encoding='utf-8')
    df_final.to_excel(excel_file, index=False, engine='openpyxl')
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(games_complete, f, indent=2, ensure_ascii=False)
    
    print(f"✓ {csv_file}")
    print(f"✓ {excel_file}")
    print(f"✓ {json_file}")
    
    # SCHRITT 5: Statistiken
    print("\n" + "="*70)
    print("STATISTIKEN")
    print("="*70)
    print(f"Gesamt Spiele: {len(df_final)}")
    print(f"Erfolgreich: {len(games_complete)}/{len(games)}")
    print(f"Family ID: {family_id} (in ALLEN Spielen gespeichert)")  # ← NEU!
    
    print("\n" + "="*70)
    print("🎉 FERTIG!")
    print("="*70)
    print(f"\n✅ Alle Spiele haben 'family_id' = {family_id}")
    print("✅ Bereit für Merge mit Family ID Support!")
    
    return df_final


# ============================================================================
# AUSFÜHRUNG
# ============================================================================

if __name__ == "__main__":
    
    # ========================================================================
    # NUR DIESE ZEILE ÄNDERN:
    # ========================================================================
    
    FAMILY_ID = 5574
    # ← Basketball, Baseball, etc.
    
    # ========================================================================
    # BEKANNTE IDs:
    # ========================================================================
    """
    SPORTS:
        6973: 'Aerial Racing--',
        5640: 'American Football--',
        5712: 'Athletics / Track and Field--',
        5820: 'Australian Football--',
        6206: 'Auto Racing--',
        18684: 'Badminton--',
        5586: 'Baseball--',
        5574: 'Basketball--',
        37345: 'Biathlon--',
        5663: 'Bicycling / Cycling--',
        6949: 'Billiards / Snooker / Pool--',
        5700: 'Bowling--',
        5839: 'Boxing--',
        68958: 'Chariot Racing--',
        5786: 'Combat Sports / Martial Arts--',
        5706: 'Cricket--',
        5840: 'Curling--',
        110437: 'Dacing--',
        79834: 'Dog Sledding--',
        71035: 'Equestrian--',
        71169: 'Fencing--',
        71018: 'Field Hockey--',
        5551: 'Soccer / Football--',
        72934: 'Formula 1--',
        66520: 'Gaelic Football--',
        68890: 'Giro dItalia--',
        5652: 'Golf--',
        5832: 'Greyhound Racing--',
        5730: 'Horse Racing--',
        6096: 'Hunting--',
        112585: 'Hydroplane Racing--',
        5628: 'Ice Hockey--',
        112586: 'Kung Fu--',
        68889: 'La Vuelta a España--',
        20717: 'Motorcycle Racing--',
        6043: 'Mountain Climbing--',
        5837: 'Olympics--',
        67047: 'Paintball--',
        112371: 'Pétanque--',
        26841: 'Roller Derby--',
        70466: 'Rowing--',
        5573: 'Rugby--',
        5831: 'Sailing--',
        6496: 'Skateboarding--',
        68282: 'Skiing--',
        6497: 'Surfing--',
        5626: 'Tennis--',
        66168: 'Tour de France--',
        19284: 'Volleyball--',
        5732: 'Winter Sports--',
        5664: 'Wrestling--'

    """
    
    # ========================================================================
    # OPTIONALE EINSTELLUNGEN:
    # ========================================================================
    
    BATCH_SIZE = 50
    DELAY = 3
    
    # ========================================================================
    # HOLE FAMILY NAME & STARTE
    # ========================================================================
    
    FAMILY_NAME = get_family_name(FAMILY_ID)
    
    df = scrape_bgg_family(
        family_id=FAMILY_ID,
        family_name=FAMILY_NAME,
        batch_size=BATCH_SIZE,
        delay=DELAY
    )
    
    print(f"\n📁 Dateien im aktuellen Verzeichnis gespeichert!")