// ============================================================
// FDF Commissioner — Name Generator
// ============================================================

// ── First Names (~200, diverse backgrounds) ─────────────────

const FIRST_NAMES = [
  // American/English
  "James", "Marcus", "Tyler", "Brandon", "Patrick", "Caleb", "Austin",
  "Justin", "Derek", "Kyle", "Ryan", "Chris", "Mike", "Josh", "Jake",
  "Zach", "Cody", "Trevor", "Nate", "Mason", "Hunter", "Logan", "Cole",
  "Bryce", "Luke", "Matt", "Sam", "Adam", "Aaron", "Eric", "Kevin",
  "Jordan", "Sean", "Brian", "Nick", "Drew", "Shane", "Blake", "Grant",
  "Chase", "Troy", "Brock", "Colton", "Preston", "Reed", "Davis", "Carson",
  "Tanner", "Tucker", "Garrett", "Spencer", "Cooper", "Mitchell", "Parker",
  // African American
  "DeShawn", "Darius", "Terrell", "Jamal", "Tyrone", "Andre", "Lamar",
  "DeMarcus", "Jalen", "Malik", "Tyreek", "Devonte", "Marquise", "Rashad",
  "Kahlil", "Davon", "Treyvon", "Isaiah", "Elijah", "Jaylen", "Khalil",
  "Devin", "Darnell", "Keonte", "Tavon", "Montez", "Javon", "Quincy",
  "Cedric", "Demetrius", "Reggie", "Terrance", "Corey", "Rodney", "Jerome",
  // Latino
  "Carlos", "Miguel", "Roberto", "Diego", "Alejandro", "Rafael",
  "Eduardo", "Fernando", "Luis", "Mateo", "Adrian", "Gabriel", "Marco",
  "Victor", "Oscar", "Antonio", "Javier", "Hector", "Raul", "Sergio",
  // Polynesian/Pacific Islander
  "Tua", "Malakai", "Penei", "Tuli", "Alohi", "Sione", "Vita",
  "Makai", "Keanu", "Ioane",
  // Various
  "Ndamukong", "Aidan", "Connor", "Liam", "Owen", "Declan", "Rowan",
  "Ezra", "Kai", "Noah", "Ethan", "Jackson", "Daniel", "Landon",
  "Wyatt", "Harrison", "Bennett", "Sullivan", "Donovan", "Greyson",
  "Leo", "Felix", "Asher", "Brooks", "Atlas", "Jude", "Beckett",
  "Roman", "Theo", "Silas", "Knox", "Rhett", "Bo", "Wells",
  "Nico", "Ace", "Duke", "Cash", "Cruz", "Rex", "Nash",
  "Sterling", "Brixton", "Zane", "Axel", "Kane", "Cade", "Ford",
  "Ty", "Ray", "AJ", "JT", "CJ", "DJ", "TJ",
  "Troy", "Beau", "Clay", "Wade", "Lane", "Trace", "Colby",
];

// ── Last Names (~300, diverse backgrounds) ──────────────────

const LAST_NAMES = [
  "Williams", "Johnson", "Smith", "Brown", "Jones", "Davis", "Miller",
  "Jackson", "Thompson", "Harris", "Robinson", "Clark", "Lewis",
  "Washington", "Garcia", "Martinez", "Rodriguez", "Hernandez",
  "Anderson", "Thomas", "Taylor", "Moore", "Martin", "Lee", "Walker",
  "White", "Allen", "Young", "King", "Wright", "Scott", "Green",
  "Baker", "Adams", "Nelson", "Hill", "Campbell", "Mitchell", "Carter",
  "Roberts", "Turner", "Phillips", "Parker", "Evans", "Edwards", "Collins",
  "Stewart", "Sanchez", "Morris", "Rogers", "Reed", "Cook", "Morgan",
  "Bell", "Murphy", "Bailey", "Rivera", "Cooper", "Richardson", "Cox",
  "Howard", "Ward", "Torres", "Peterson", "Gray", "Ramirez", "James",
  "Watson", "Brooks", "Kelly", "Sanders", "Price", "Bennett", "Wood",
  "Barnes", "Ross", "Henderson", "Coleman", "Jenkins", "Perry", "Powell",
  "Long", "Patterson", "Hughes", "Flores", "Butler", "Simmons", "Foster",
  "Gonzales", "Bryant", "Alexander", "Russell", "Griffin", "Diaz", "Hayes",
  "Myers", "Ford", "Hamilton", "Graham", "Sullivan", "Wallace", "Woods",
  "Cole", "West", "Jordan", "Owens", "Reynolds", "Fisher", "Ellis",
  "Harrison", "Gibson", "Marshall", "Chapman", "Warren", "Freeman",
  "Burns", "Cunningham", "Simpson", "Duncan", "Coleman", "Rice",
  "Daniels", "Harper", "Stephens", "Craig", "Lambert", "Fleming",
  "Watkins", "Chambers", "Hicks", "Drake", "Bates", "Morton",
  "Brady", "Manning", "Mahomes", "Kelce", "McCaffrey", "Prescott",
  "Lawrence", "Parsons", "Hutchinson", "Chase", "Jefferson", "Adams",
  "Okafor", "Nwosu", "Aiyuk", "Bosa", "Watt", "Garrett", "Chubb",
  "Mixon", "Swift", "Lamb", "Hill", "Henry", "Kamara", "Cook",
  "Deebo", "Diggs", "Waddle", "Tyreek", "Metcalf", "McLaurin",
  "Surtain", "Gardner", "Stingley", "Woolen", "Branch", "Sauce",
  "Wagner", "Leonard", "Roquan", "Warner", "Davis", "Campbell",
  "Buckner", "Donald", "Allen", "Jones", "Heyward", "Williams",
  "Ramsey", "Howard", "White", "Winfield", "Byard", "Simmons",
  "McKinnon", "Stevenson", "Robinson", "Pollard", "Jacobs", "Walker",
  "Olsen", "Kittle", "Kelce", "Andrews", "Pitts", "Hockenson",
  "Tucker", "Bass", "McPherson", "Boswell", "Carlson", "Butker",
  "Stone", "Black", "Silver", "Cross", "Steele", "Golden", "Powers",
  "Frost", "Storm", "Ridge", "Blaze", "Knight", "Justice", "Strong",
  "Hope", "Noble", "Fury", "Wolf", "Hawk", "Fox", "Steel",
  "Cash", "Banks", "Field", "Lane", "Street", "Bridge", "Gate",
  "Pierce", "Slater", "Sewell", "Wirfs", "Smith-Njigba", "Addison",
  "Stroud", "Young", "Richardson", "Levis", "Maye", "Daniels",
  "Harrison", "Nabers", "Worthy", "Bowers", "Mitchell", "Brooks",
  "McMillan", "Dallas", "Latu", "Penix", "Nix", "McCarthy",
  "DeWalt", "Chandler", "Simmons", "Thorpe", "Blackwell", "Sterling",
  "Ashford", "Beaumont", "Caldwell", "Donovan", "Eastman", "Fairley",
  "Granger", "Holbrook", "Irving", "Jarrett", "Kendrick", "Lockwood",
  "Mercer", "Norwood", "O'Brien", "Preston", "Quinlan", "Rutherford",
  "Sinclair", "Thornton", "Underwood", "Vaughn", "Westbrook", "York",
  "Zimmerman", "Armstrong", "Blackwood", "Crawford", "Donaldson",
];

// ── Coach First Names (~50, traditional) ────────────────────

const COACH_FIRST_NAMES = [
  "Bill", "Mike", "Dan", "John", "Tom", "Pete", "Andy", "Kevin", "Sean",
  "Jim", "Rob", "Steve", "Doug", "Brian", "Frank", "Gary", "Matt",
  "Nick", "Rick", "Tony", "Bruce", "Dave", "Don", "Ed", "Greg",
  "Jeff", "Ken", "Mark", "Paul", "Ron", "Art", "Chuck", "Dennis",
  "George", "Hank", "Jack", "Joe", "Larry", "Lou", "Marv", "Norm",
  "Ray", "Sam", "Vince", "Walt", "Zach", "Ben", "Cliff", "Hal", "Russ",
];

// ── Cities (~100+, US without NFL franchise + international) ─

interface CityEntry {
  name: string;
  region?: string;
  country?: string;
}

const CITIES: CityEntry[] = [
  // US Cities
  { name: "Portland", region: "Oregon" },
  { name: "Austin", region: "Texas" },
  { name: "Memphis", region: "Tennessee" },
  { name: "Salt Lake City", region: "Utah" },
  { name: "Birmingham", region: "Alabama" },
  { name: "San Antonio", region: "Texas" },
  { name: "Omaha", region: "Nebraska" },
  { name: "Raleigh", region: "North Carolina" },
  { name: "Milwaukee", region: "Wisconsin" },
  { name: "Oklahoma City", region: "Oklahoma" },
  { name: "Louisville", region: "Kentucky" },
  { name: "Richmond", region: "Virginia" },
  { name: "Hartford", region: "Connecticut" },
  { name: "Norfolk", region: "Virginia" },
  { name: "Tucson", region: "Arizona" },
  { name: "Albuquerque", region: "New Mexico" },
  { name: "Boise", region: "Idaho" },
  { name: "Des Moines", region: "Iowa" },
  { name: "Honolulu", region: "Hawaii" },
  { name: "Anchorage", region: "Alaska" },
  { name: "Charleston", region: "South Carolina" },
  { name: "Savannah", region: "Georgia" },
  { name: "El Paso", region: "Texas" },
  { name: "Fresno", region: "California" },
  { name: "Tulsa", region: "Oklahoma" },
  { name: "Spokane", region: "Washington" },
  { name: "Little Rock", region: "Arkansas" },
  { name: "Knoxville", region: "Tennessee" },
  { name: "Dayton", region: "Ohio" },
  { name: "Akron", region: "Ohio" },
  { name: "Rochester", region: "New York" },
  { name: "Syracuse", region: "New York" },
  { name: "Tacoma", region: "Washington" },
  { name: "Wichita", region: "Kansas" },
  { name: "Grand Rapids", region: "Michigan" },
  { name: "Mobile", region: "Alabama" },
  { name: "Chattanooga", region: "Tennessee" },
  { name: "Lexington", region: "Kentucky" },
  { name: "Baton Rouge", region: "Louisiana" },
  { name: "Shreveport", region: "Louisiana" },
  { name: "Colorado Springs", region: "Colorado" },
  { name: "Reno", region: "Nevada" },
  { name: "Santa Fe", region: "New Mexico" },
  { name: "Pensacola", region: "Florida" },
  { name: "Fargo", region: "North Dakota" },
  { name: "Bismarck", region: "North Dakota" },
  { name: "Sioux Falls", region: "South Dakota" },
  { name: "Burlington", region: "Vermont" },
  { name: "Sarasota", region: "Florida" },
  { name: "Macon", region: "Georgia" },
  { name: "Bozeman", region: "Montana" },
  { name: "Duluth", region: "Minnesota" },
  { name: "Cedar Rapids", region: "Iowa" },
  { name: "Springfield", region: "Illinois" },
  { name: "Tallahassee", region: "Florida" },
  { name: "Augusta", region: "Georgia" },
  { name: "Corpus Christi", region: "Texas" },
  { name: "Durham", region: "North Carolina" },
  { name: "Winston-Salem", region: "North Carolina" },
  { name: "Amarillo", region: "Texas" },
  // International
  { name: "London", country: "UK" },
  { name: "Berlin", country: "Germany" },
  { name: "Tokyo", country: "Japan" },
  { name: "Mexico City", country: "Mexico" },
  { name: "Toronto", country: "Canada" },
  { name: "Sydney", country: "Australia" },
  { name: "Paris", country: "France" },
  { name: "Munich", country: "Germany" },
  { name: "Madrid", country: "Spain" },
  { name: "Rome", country: "Italy" },
  { name: "Dublin", country: "Ireland" },
  { name: "Amsterdam", country: "Netherlands" },
  { name: "Stockholm", country: "Sweden" },
  { name: "Vienna", country: "Austria" },
  { name: "Zurich", country: "Switzerland" },
  { name: "Lagos", country: "Nigeria" },
  { name: "São Paulo", country: "Brazil" },
  { name: "Seoul", country: "South Korea" },
  { name: "Montreal", country: "Canada" },
  { name: "Vancouver", country: "Canada" },
  { name: "Frankfurt", country: "Germany" },
  { name: "Barcelona", country: "Spain" },
  { name: "Copenhagen", country: "Denmark" },
  { name: "Warsaw", country: "Poland" },
  { name: "Prague", country: "Czech Republic" },
  { name: "Helsinki", country: "Finland" },
  { name: "Oslo", country: "Norway" },
  { name: "Auckland", country: "New Zealand" },
];

// ── Team Nicknames (~150, categorized) ──────────────────────

interface NicknameEntry {
  name: string;
  category: string;
}

const TEAM_NICKNAMES: NicknameEntry[] = [
  // Animals
  { name: "Wolves", category: "animal" },
  { name: "Hawks", category: "animal" },
  { name: "Vipers", category: "animal" },
  { name: "Mustangs", category: "animal" },
  { name: "Sharks", category: "animal" },
  { name: "Grizzlies", category: "animal" },
  { name: "Cougars", category: "animal" },
  { name: "Cobras", category: "animal" },
  { name: "Wildcats", category: "animal" },
  { name: "Stallions", category: "animal" },
  { name: "Raptors", category: "animal" },
  { name: "Scorpions", category: "animal" },
  { name: "Hornets", category: "animal" },
  { name: "Stingrays", category: "animal" },
  { name: "Mavericks", category: "animal" },
  { name: "Bison", category: "animal" },
  { name: "Timberwolves", category: "animal" },
  { name: "Razorbacks", category: "animal" },
  { name: "Gators", category: "animal" },
  { name: "Barracudas", category: "animal" },
  { name: "Bulldogs", category: "animal" },
  { name: "Huskies", category: "animal" },
  { name: "Jackals", category: "animal" },
  { name: "Condors", category: "animal" },
  { name: "Owls", category: "animal" },
  { name: "Orcas", category: "animal" },
  { name: "Lynx", category: "animal" },
  { name: "Rattlers", category: "animal" },
  { name: "Copperheads", category: "animal" },
  { name: "Warhawks", category: "animal" },
  // Mythology/Fantasy
  { name: "Titans", category: "mythology" },
  { name: "Spartans", category: "mythology" },
  { name: "Sentinels", category: "mythology" },
  { name: "Knights", category: "mythology" },
  { name: "Gladiators", category: "mythology" },
  { name: "Centurions", category: "mythology" },
  { name: "Guardians", category: "mythology" },
  { name: "Warriors", category: "mythology" },
  { name: "Legends", category: "mythology" },
  { name: "Crusaders", category: "mythology" },
  { name: "Valkyries", category: "mythology" },
  { name: "Phoenixes", category: "mythology" },
  { name: "Griffins", category: "mythology" },
  { name: "Monarchs", category: "mythology" },
  { name: "Conquerors", category: "mythology" },
  { name: "Warlords", category: "mythology" },
  { name: "Dragoons", category: "mythology" },
  { name: "Paladins", category: "mythology" },
  { name: "Samurai", category: "mythology" },
  { name: "Vikings", category: "mythology" },
  // Industry/Profession
  { name: "Ironworks", category: "industry" },
  { name: "Miners", category: "industry" },
  { name: "Aviators", category: "industry" },
  { name: "Pioneers", category: "industry" },
  { name: "Roughnecks", category: "industry" },
  { name: "Builders", category: "industry" },
  { name: "Forge", category: "industry" },
  { name: "Rivermen", category: "industry" },
  { name: "Oilers", category: "industry" },
  { name: "Marshals", category: "industry" },
  { name: "Generals", category: "industry" },
  { name: "Admirals", category: "industry" },
  { name: "Pilots", category: "industry" },
  { name: "Rangers", category: "industry" },
  { name: "Troopers", category: "industry" },
  { name: "Outlaws", category: "industry" },
  { name: "Enforcers", category: "industry" },
  { name: "Express", category: "industry" },
  { name: "Wreckers", category: "industry" },
  { name: "Demolishers", category: "industry" },
  // Nature/Weather
  { name: "Thunder", category: "nature" },
  { name: "Blaze", category: "nature" },
  { name: "Hurricanes", category: "nature" },
  { name: "Avalanche", category: "nature" },
  { name: "Inferno", category: "nature" },
  { name: "Storm", category: "nature" },
  { name: "Surge", category: "nature" },
  { name: "Cyclones", category: "nature" },
  { name: "Eclipse", category: "nature" },
  { name: "Tremors", category: "nature" },
  { name: "Tidal Wave", category: "nature" },
  { name: "Firestorm", category: "nature" },
  { name: "Flash", category: "nature" },
  { name: "Voltage", category: "nature" },
  { name: "Quake", category: "nature" },
  { name: "Frost", category: "nature" },
  { name: "Torrent", category: "nature" },
  { name: "Solar Flare", category: "nature" },
  { name: "Wildfire", category: "nature" },
  { name: "Riptide", category: "nature" },
  // Misc
  { name: "Aces", category: "misc" },
  { name: "Fury", category: "misc" },
  { name: "Rampage", category: "misc" },
  { name: "Revolution", category: "misc" },
  { name: "Rebellion", category: "misc" },
  { name: "Renegades", category: "misc" },
  { name: "Bandits", category: "misc" },
  { name: "Havoc", category: "misc" },
  { name: "Riot", category: "misc" },
  { name: "Chaos", category: "misc" },
  { name: "Phantom", category: "misc" },
  { name: "Shadow", category: "misc" },
  { name: "Spectre", category: "misc" },
  { name: "Arsenal", category: "misc" },
  { name: "Armada", category: "misc" },
  { name: "Vanguard", category: "misc" },
  { name: "Impact", category: "misc" },
  { name: "Apex", category: "misc" },
  { name: "Reign", category: "misc" },
  { name: "Glory", category: "misc" },
];

// ── Color Palettes ──────────────────────────────────────────

interface TeamColors {
  primary: string;
  secondary: string;
}

const COLOR_PALETTES: TeamColors[] = [
  { primary: "#1a237e", secondary: "#ffd600" }, // Navy / Gold
  { primary: "#b71c1c", secondary: "#ffffff" }, // Red / White
  { primary: "#004d40", secondary: "#ffab00" }, // Teal / Amber
  { primary: "#1b5e20", secondary: "#c0c0c0" }, // Forest Green / Silver
  { primary: "#e65100", secondary: "#263238" }, // Orange / Charcoal
  { primary: "#4a148c", secondary: "#ffc107" }, // Purple / Gold
  { primary: "#0d47a1", secondary: "#ff6f00" }, // Blue / Orange
  { primary: "#263238", secondary: "#b0bec5" }, // Black / Silver
  { primary: "#880e4f", secondary: "#f5f5f5" }, // Maroon / White
  { primary: "#006064", secondary: "#e0e0e0" }, // Cyan / Light Grey
  { primary: "#33691e", secondary: "#fff176" }, // Dark Green / Yellow
  { primary: "#bf360c", secondary: "#212121" }, // Burnt Orange / Black
  { primary: "#311b92", secondary: "#e0e0e0" }, // Deep Purple / Grey
  { primary: "#01579b", secondary: "#ff3d00" }, // Dark Blue / Red
  { primary: "#3e2723", secondary: "#ff8f00" }, // Brown / Amber
  { primary: "#c62828", secondary: "#1565c0" }, // Red / Blue
  { primary: "#00695c", secondary: "#f5f5f5" }, // Dark Teal / White
  { primary: "#ad1457", secondary: "#ffd54f" }, // Crimson / Gold
  { primary: "#1565c0", secondary: "#ffffff" }, // Royal Blue / White
  { primary: "#2e7d32", secondary: "#ffd600" }, // Green / Gold
  { primary: "#4e342e", secondary: "#ffab00" }, // Dark Brown / Amber
  { primary: "#0277bd", secondary: "#e53935" }, // Light Blue / Red
  { primary: "#558b2f", secondary: "#263238" }, // Lime / Charcoal
  { primary: "#6a1b9a", secondary: "#f5f5f5" }, // Purple / White
  { primary: "#d84315", secondary: "#37474f" }, // Deep Orange / Dark Grey
  { primary: "#283593", secondary: "#ff8a65" }, // Indigo / Salmon
  { primary: "#00838f", secondary: "#fdd835" }, // Cyan / Yellow
  { primary: "#4527a0", secondary: "#ec407a" }, // Purple / Pink
  { primary: "#ef6c00", secondary: "#1a237e" }, // Orange / Navy
  { primary: "#37474f", secondary: "#4caf50" }, // Charcoal / Green
];

// ============================================================
// Generator Functions
// ============================================================

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Generate a random player name */
export function generatePlayerName(): string {
  return `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
}

/** Generate a random coach name (more traditional feel) */
export function generateCoachName(): string {
  return `${randomFrom(COACH_FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
}

/** Generate N unique player names */
export function generateUniquePlayerNames(count: number): string[] {
  const names = new Set<string>();
  let attempts = 0;
  while (names.size < count && attempts < count * 10) {
    names.add(generatePlayerName());
    attempts++;
  }
  return Array.from(names);
}

/** Generate a unique coach name not in the existing list */
export function generateUniqueCoachName(existingNames: string[]): string {
  const existing = new Set(existingNames);
  let attempts = 0;
  while (attempts < 100) {
    const name = generateCoachName();
    if (!existing.has(name)) return name;
    attempts++;
  }
  return generateCoachName(); // Fallback
}

/** Generate a random team name (city + nickname) */
export function generateTeamName(): { city: string; nickname: string } {
  return {
    city: randomFrom(CITIES).name,
    nickname: randomFrom(TEAM_NICKNAMES).name,
  };
}

/** Generate N unique team names (no duplicate cities or nicknames) */
export function generateUniqueTeamNames(
  count: number
): { city: string; nickname: string }[] {
  const cities = shuffled(CITIES).slice(0, count);
  const nicknames = shuffled(TEAM_NICKNAMES).slice(0, count);
  return cities.map((c, i) => ({
    city: c.name,
    nickname: nicknames[i].name,
  }));
}

/** Generate a 2-3 letter abbreviation from a city name */
export function generateAbbreviation(city: string): string {
  // Handle multi-word cities
  const words = city.replace(/[^a-zA-Z\s]/g, "").split(/\s+/);
  if (words.length >= 2) {
    // Take first letter of each word (up to 3)
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  // Single word: take first 3 letters
  return city.slice(0, 3).toUpperCase();
}

/** Generate team colors avoiding similar colors to existing teams */
export function generateTeamColors(existingColors: string[][]): TeamColors {
  // Try to find a palette not too similar to existing ones
  const existingPrimaries = new Set(existingColors.map((c) => c[0]));
  const available = COLOR_PALETTES.filter(
    (p) => !existingPrimaries.has(p.primary)
  );
  if (available.length > 0) {
    return randomFrom(available);
  }
  return randomFrom(COLOR_PALETTES);
}

/** Generate complete team data for N teams */
export function generateTeamBatch(count: number): {
  city: string;
  nickname: string;
  abbreviation: string;
  colors: TeamColors;
}[] {
  const names = generateUniqueTeamNames(count);
  const usedColors: string[][] = [];

  return names.map((n) => {
    const colors = generateTeamColors(usedColors);
    usedColors.push([colors.primary, colors.secondary]);
    return {
      city: n.city,
      nickname: n.nickname,
      abbreviation: generateAbbreviation(n.city),
      colors,
    };
  });
}
