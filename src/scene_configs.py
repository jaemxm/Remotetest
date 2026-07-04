"""40 starred American history events, each specified as a pixel-art scene."""

from __future__ import annotations


SCENES = [
    {
        "id": "01",
        "year": "C. 1000",
        "title": "LEIF ERIKSON",
        "subtitle": "NORSE REACH VINLAND",
        "iconic": (
            "A large Norse Viking warrior — Leif Erikson — standing on the "
            "stern of a Viking longship, horned helmet, long braided red beard, "
            "chainmail under fur-trimmed tunic, red cape, raising a spear. The "
            "longship has a red-and-cream striped square sail billowing, thick "
            "rope rigging, seven round Viking shields hung along the gunwale, "
            "and a fierce carved dragon-head prow. In the distance on the right, "
            "the rocky new-world Vinland coast with snow-capped mountains and "
            "conifer forest. Sunrise sky, birds, calm sea with wave crests."
        ),
        "palette": "warm sunrise: deep indigo top, violet, pink, orange, gold",
    },
    {
        "id": "02",
        "year": "1492",
        "title": "COLUMBUS SAILS WEST",
        "subtitle": "ATLANTIC CROSSING",
        "iconic": (
            "Christopher Columbus in Renaissance velvet doublet and feathered "
            "cap standing at the bow of the Santa Maria, spyglass in hand, "
            "pointing westward. Three Spanish caravels (Niña, Pinta, Santa "
            "María) in formation crossing a vast blue Atlantic, red crosses on "
            "the sails, Spanish royal flag flying. Above: night-to-dawn sky "
            "with visible stars still lingering, a compass rose faintly in the "
            "clouds. Ocean waves with foam curls."
        ),
        "palette": "deep ocean blue, cream sails, red crosses, twilight sky",
    },
    {
        "id": "03",
        "year": "AFTER 1492",
        "title": "COLUMBIAN EXCHANGE",
        "subtitle": "TWO WORLDS TRADE",
        "iconic": (
            "A split-scene showing the Columbian Exchange: on the left, "
            "European items flowing right — horses, cattle, wheat sheaves, "
            "honeybees, sugar cane. On the right, American items flowing left "
            "— corn cobs, potatoes, tomatoes, cocoa beans, tobacco leaves, "
            "turkeys. In the middle, a wooden trade ship on the ocean linking "
            "the two continents. Above, small silhouettes of both worlds' "
            "coastlines meeting in a decorative cartouche."
        ),
        "palette": "green and gold, contrast of European stone and Native earth tones",
    },
    {
        "id": "04",
        "year": "1590",
        "title": "THE LOST COLONY",
        "subtitle": "ROANOKE VANISHES",
        "iconic": (
            "A mysterious empty English wooden colonial settlement at Roanoke "
            "Island, doors ajar, thatched roofs sagging, no people in sight. "
            "In the foreground, a wooden post with the single word 'CROATOAN' "
            "clearly carved into it. A confused colonial explorer in Elizabethan "
            "dress kneels examining the carving, holding a lantern in evening "
            "light. Overgrown weeds, a rusted iron kettle abandoned, sea in "
            "the distance."
        ),
        "palette": "dusk mystery: teal shadow, foggy purple, warm lantern gold",
    },
    {
        "id": "05",
        "year": "1607",
        "title": "JAMESTOWN",
        "subtitle": "FIRST ENGLISH COLONY",
        "iconic": (
            "The Jamestown wooden triangular palisade fort under construction "
            "on a Virginia riverbank, tall pointed log walls, a wooden watch "
            "tower. English colonists in early-1600s dress hammering, sawing "
            "and building; Captain John Smith in armor and helmet gesturing "
            "orders. The three ships (Susan Constant, Godspeed, Discovery) "
            "anchored in the river behind. A Union Jack flying. Forest around."
        ),
        "palette": "warm brown wood, green forest, blue river, red flag",
    },
    {
        "id": "06",
        "year": "1619",
        "title": "HOUSE OF BURGESSES",
        "subtitle": "FIRST ASSEMBLY",
        "iconic": (
            "Interior of a modest wooden colonial church in Jamestown, Virginia, "
            "1619. Elected burgesses in 17th-century Puritan and colonial dress "
            "seated at long wooden tables, some standing to speak. Sunlight "
            "through diamond-pane windows. A wooden gavel, quill pens, "
            "parchments and inkwells on the tables. A dignified, historic mood "
            "— the birth of American representative government."
        ),
        "palette": "warm candlelit interior, dark oak wood, cream parchment",
    },
    {
        "id": "07",
        "year": "1620",
        "title": "THE MAYFLOWER",
        "subtitle": "PILGRIMS AT PLYMOUTH",
        "iconic": (
            "The Mayflower, a heavy 17th-century English galleon with tall "
            "square sails, arriving at Plymouth Rock, Massachusetts on a cold "
            "grey autumn day. Pilgrims in tall black hats, white collars and "
            "buckle shoes disembarking onto a rocky shore, one leader kneels "
            "in prayer, others carry chests and children. The famous Plymouth "
            "Rock in the foreground. Bare trees, seagulls, cold blue sea."
        ),
        "palette": "cold slate blue, muted grey, autumn brown, black and white pilgrim garb",
    },
    {
        "id": "08",
        "year": "1754-1763",
        "title": "FRENCH AND INDIAN WAR",
        "subtitle": "BRITAIN WINS OHIO VALLEY",
        "iconic": (
            "A wooded battle scene in the Ohio Valley. British Redcoats in "
            "tight formation with bayoneted muskets on one side; French "
            "soldiers in white uniforms with tricorne hats and their Native "
            "American allies (in war paint, with tomahawks and bows) on the "
            "other side. Musket smoke drifting through pine trees. A young "
            "Colonel George Washington in blue Virginia militia uniform on a "
            "horse in the foreground, sword raised. Autumn leaves."
        ),
        "palette": "autumn woods: rust, gold, red, deep pine green, blue coats",
    },
    {
        "id": "09",
        "year": "1773",
        "title": "BOSTON TEA PARTY",
        "subtitle": "NO TAX ON TEA",
        "iconic": (
            "Nighttime at Boston Harbor, December 16, 1773. Colonial Sons of "
            "Liberty disguised as Mohawk warriors — faces painted, feather "
            "headbands, blankets over shoulders — hurling large wooden tea "
            "chests overboard from a British merchant ship. Splashing tea "
            "chests hitting the harbor water. Lanterns glowing. A crowd of "
            "colonists cheering on the dock in the background. Full moon in "
            "the dark sky, silhouetted ship masts."
        ),
        "palette": "moonlit blue night, warm lantern gold, deep harbor blues",
    },
    {
        "id": "10",
        "year": "1775",
        "title": "PAUL REVERE",
        "subtitle": "MIDNIGHT RIDE",
        "iconic": (
            "Paul Revere on horseback galloping down a New England country "
            "road at midnight, tricorne hat pushed back, colonial coat "
            "flying behind him, arm raised shouting a warning. Behind him, "
            "the Old North Church steeple with two lanterns visible in its "
            "belfry ('One if by land, two if by sea'). Sleeping colonial "
            "houses with lit windows just waking up. Full moon, stars, dark "
            "silhouetted trees."
        ),
        "palette": "moonlit blue, warm window glow, silver moon",
    },
    {
        "id": "11",
        "year": "1775",
        "title": "LEXINGTON AND CONCORD",
        "subtitle": "SHOT HEARD ROUND THE WORLD",
        "iconic": (
            "The Lexington town green at dawn, April 19, 1775. A line of "
            "colonial Minutemen in mismatched farm clothes with muskets facing "
            "off against a line of British Redcoats in perfect formation. "
            "Musket smoke rising, muzzle flashes, one Minuteman falling. A "
            "wooden meeting house in the background. American flag not yet "
            "created — Sons of Liberty red-and-white striped flag flying. "
            "Green field with morning mist."
        ),
        "palette": "misty dawn, red coats vs earth-tone patriots, muzzle-flash yellow",
    },
    {
        "id": "12",
        "year": "1776",
        "title": "DECLARATION",
        "subtitle": "LIFE LIBERTY HAPPINESS",
        "iconic": (
            "The scene inside Independence Hall, Philadelphia, July 4, 1776. "
            "Thomas Jefferson standing tall in a burgundy waistcoat, quill in "
            "hand, laying the parchment of the Declaration of Independence on "
            "a wooden desk. John Adams and Benjamin Franklin at his side "
            "reviewing. Other founding fathers in wigs and colonial dress "
            "gathered around. Sunlight through the tall windows, wooden floor, "
            "American colonial furniture. A candlestick, an inkwell, the "
            "parchment prominently in focus."
        ),
        "palette": "warm oak wood, burgundy, cream parchment, gold sun",
    },
    {
        "id": "13",
        "year": "1787",
        "title": "CONSTITUTION",
        "subtitle": "WE THE PEOPLE",
        "iconic": (
            "James Madison, 'Father of the Constitution', standing at a wooden "
            "podium in Independence Hall holding a scroll that reads 'WE THE "
            "PEOPLE' in bold calligraphy. Delegates in tricorne hats seated "
            "around him in the Constitutional Convention. Three symbolic pillars "
            "labelled 'LEGISLATIVE', 'EXECUTIVE', 'JUDICIAL' appear behind him. "
            "A quill, inkwell, and a golden gavel on the podium. American "
            "eagle emblem overhead."
        ),
        "palette": "dignified navy blue, gold accents, warm wood tones",
    },
    {
        "id": "14",
        "year": "1791",
        "title": "BILL OF RIGHTS",
        "subtitle": "TEN AMENDMENTS",
        "iconic": (
            "A large ornate parchment scroll, unrolled prominently in the "
            "center, with 'BILL OF RIGHTS' at the top and the numbered numerals "
            "I through X down its length, each numeral in gothic script. "
            "Draped over an American colonial writing desk with a quill pen "
            "and an inkwell. Behind the parchment, a torn colonial curtain "
            "reveals a stylized American eagle with an olive branch and "
            "arrows in its talons."
        ),
        "palette": "cream parchment, deep navy, gold ink, red-white-blue",
    },
    {
        "id": "15",
        "year": "1789",
        "title": "PRESIDENT WASHINGTON",
        "subtitle": "FIRST INAUGURATION",
        "iconic": (
            "George Washington in a dark brown suit with a powdered wig, hand "
            "on a Bible, being sworn in on the balcony of Federal Hall in New "
            "York City, April 30, 1789. Chief Justice Robert Livingston in a "
            "long robe swearing him in. A crowd of Americans in colonial "
            "clothing below cheering. The American flag flying. City buildings "
            "of 18th-century New York in the background."
        ),
        "palette": "warm colonial brown and cream, patriotic red-white-blue",
    },
    {
        "id": "16",
        "year": "1803",
        "title": "LOUISIANA PURCHASE",
        "subtitle": "NATION DOUBLES",
        "iconic": (
            "A large stylized map of North America in the foreground with the "
            "vast Louisiana Territory highlighted in a bright golden-yellow "
            "brushstroke, stretching from the Mississippi to the Rockies. "
            "Thomas Jefferson in colonial dress and Napoleon Bonaparte in his "
            "characteristic bicorne hat and gold-embroidered coat shaking "
            "hands across the map. Fifteen million dollars in gold coins "
            "stacked at the corner. The Louisiana river network etched on the "
            "map. Compass rose."
        ),
        "palette": "map cream and gold, blue rivers, dramatic green territories",
    },
    {
        "id": "17",
        "year": "1849",
        "title": "THE FORTY-NINERS",
        "subtitle": "CALIFORNIA GOLD RUSH",
        "iconic": (
            "A California Gold Rush prospector — bearded 49er with a battered "
            "hat, red flannel shirt, suspenders, holding up a gleaming gold "
            "nugget from his shallow tin pan, eyes wide with joy. Behind him "
            "a rocky sun-baked mining creek with other prospectors panning "
            "and sluicing. A mule loaded with supplies, a wooden mining sluice "
            "box, canvas tents. Sierra Nevada mountains and pine trees in the "
            "background. Bright sunshine."
        ),
        "palette": "sun-baked golden desert, red flannel, glowing gold nugget",
    },
    {
        "id": "18",
        "year": "1861",
        "title": "CIVIL WAR BEGINS",
        "subtitle": "FORT SUMTER",
        "iconic": (
            "Fort Sumter, Charleston Harbor, April 12, 1861. A brick coastal "
            "fort under bombardment: cannonballs flying, explosions bursting, "
            "fires on the fort. A tattered U.S. flag still flying on the fort. "
            "Confederate cannons on the shore in the foreground firing across "
            "the water, smoke and flame at the muzzles. Confederate soldiers "
            "in grey uniforms loading and aiming. Dark storm-lit sky, dramatic "
            "reds and blacks."
        ),
        "palette": "dark red war sky, smoke black, cannon fire orange, fort brick",
    },
    {
        "id": "19",
        "year": "1863",
        "title": "EMANCIPATION",
        "subtitle": "PROCLAMATION",
        "iconic": (
            "President Abraham Lincoln in his tall stovepipe hat and long "
            "black coat, standing at a desk in the White House, signing the "
            "Emancipation Proclamation with a quill pen. A ray of sun through "
            "the window illuminates the document. Broken chains visibly "
            "shattering in the foreground on a marble floor. A framed portrait "
            "of the American eagle behind him. Warm hopeful golden light."
        ),
        "palette": "solemn dark suit, glowing golden document, broken iron chains",
    },
    {
        "id": "20",
        "year": "1863",
        "title": "GETTYSBURG",
        "subtitle": "TURNING POINT",
        "iconic": (
            "The Battle of Gettysburg, July 1863. Union soldiers in blue on a "
            "wheat-field ridge holding a stone wall, muskets and cannons "
            "firing volleys. Confederate soldiers in grey charging across the "
            "field ('Pickett's Charge') with rifles and bayonets. American "
            "and Confederate battle flags visible. Cannons smoking, muzzle "
            "flashes, wooden fences broken. Rolling Pennsylvania hills and a "
            "dramatic stormy sky above."
        ),
        "palette": "battle smoke, blue and grey, golden wheat, dark storm sky",
    },
    {
        "id": "21",
        "year": "1870-1900",
        "title": "GILDED AGE",
        "subtitle": "INDUSTRIAL WEALTH",
        "iconic": (
            "A grand Gilded Age scene: on the left, a tall opulent mansion "
            "with marble columns, chandeliers, wealthy top-hat industrialists "
            "in tuxedos drinking champagne. On the right side, in stark "
            "contrast, dark smoking factory smokestacks belching soot and a "
            "cramped tenement with poor immigrant workers. A railroad and a "
            "steel mill in the middle. A giant gold-plated dollar sign at the "
            "top. Gilded gold everywhere."
        ),
        "palette": "gilded gold, soot black, mansion cream, factory smoke grey",
    },
    {
        "id": "22",
        "year": "1892",
        "title": "ELLIS ISLAND",
        "subtitle": "IMMIGRANTS ARRIVE",
        "iconic": (
            "The great hall of Ellis Island, New York Harbor, 1892. A crowd "
            "of European immigrants in old-world clothing (headscarves, "
            "peasant coats, wooden trunks, and tag labels pinned to lapels) "
            "queuing to be processed by uniformed inspectors at wooden desks. "
            "Through the tall arched window, the Statue of Liberty is visible "
            "on Liberty Island, torch raised. A hopeful, dignified feel."
        ),
        "palette": "warm brick and gold, sea-blue outside, hopeful sunset light",
    },
    {
        "id": "23",
        "year": "1903",
        "title": "WRIGHT BROTHERS",
        "subtitle": "KITTY HAWK FIRST FLIGHT",
        "iconic": (
            "The Wright Flyer, a fragile wooden-and-canvas biplane, lifting "
            "off the sand dunes of Kitty Hawk, North Carolina, December 17, "
            "1903. Orville Wright lying prone on the lower wing at the "
            "controls; Wilbur Wright running alongside on the sand. Small "
            "plumes of dust behind the wheels. The wide beach and grassy "
            "dunes, with cold cloudy winter sky and choppy Atlantic ocean "
            "visible in the distance."
        ),
        "palette": "cold winter beach: pale sand, grey sky, cream biplane",
    },
    {
        "id": "24",
        "year": "1917",
        "title": "WORLD WAR I",
        "subtitle": "DOUGHBOYS OVER THERE",
        "iconic": (
            "American 'Doughboy' soldiers in WWI khaki uniforms, steel Brodie "
            "helmets, and puttees, marching in formation with bolt-action "
            "rifles slung over their shoulders. Behind them, a large "
            "recruitment poster on a brick wall reads 'UNCLE SAM WANTS YOU' "
            "with Uncle Sam pointing directly outward. In the distance, muddy "
            "European trenches with barbed wire and grey sky. An American "
            "flag flying, biplane silhouettes overhead."
        ),
        "palette": "khaki tan, muddy brown, patriotic red-white-blue poster",
    },
    {
        "id": "25",
        "year": "1929-1939",
        "title": "GREAT DEPRESSION",
        "subtitle": "BLACK TUESDAY",
        "iconic": (
            "A dust-bowl-era street scene during the Great Depression: on the "
            "left, a long solemn breadline of thin men in patched suits, "
            "worn fedoras, coats, waiting outside a soup kitchen sign. In the "
            "middle background, a dust storm rolling over a boarded-up shop. "
            "On the right, a stock ticker tape spilling from a wall, showing "
            "plunging numbers and the words 'BLACK TUESDAY 1929'. Grim grey "
            "mood, an old Model T Ford parked."
        ),
        "palette": "grim sepia, dust brown, faded newspaper grey",
    },
    {
        "id": "26",
        "year": "1933",
        "title": "THE NEW DEAL",
        "subtitle": "FDR RECOVERY",
        "iconic": (
            "President Franklin D. Roosevelt (FDR) in his wheelchair leaning "
            "forward beside a large old vintage radio microphone with 'CBS' "
            "on it, delivering a Fireside Chat. Behind him, dramatic "
            "silhouettes of hopeful workers wielding shovels and hammers "
            "building infrastructure — dams, roads, bridges — with 'CCC' and "
            "'WPA' badges. A dawn-breaking sun rising behind. Warm color "
            "signaling recovery and hope."
        ),
        "palette": "hopeful dawn: warm cream, gold, dignified navy, recovery green",
    },
    {
        "id": "27",
        "year": "1941",
        "title": "PEARL HARBOR",
        "subtitle": "DATE OF INFAMY",
        "iconic": (
            "The attack on Pearl Harbor, Hawaii, morning of December 7, 1941. "
            "American battleships (USS Arizona, West Virginia) in the harbor "
            "on fire, thick black smoke rising. Japanese Zero fighter planes "
            "with red 'meatball' rising-sun insignia swooping down. Explosions "
            "on ships, water spouts from torpedoes. American sailors "
            "scrambling on decks. Palm trees on the shore. Diamond Head in "
            "the distance. Dawn sky, orange fire mixed with dark smoke."
        ),
        "palette": "fire orange, smoke black, dawn peach, sea-navy blue",
    },
    {
        "id": "28",
        "year": "1941",
        "title": "WORLD WAR II",
        "subtitle": "ROSIE THE RIVETER",
        "iconic": (
            "Rosie the Riveter — a strong American woman factory worker with a "
            "red-and-white polka-dot bandanna in her hair, blue coveralls, "
            "flexing her bicep in the iconic 'We Can Do It!' pose. Behind her, "
            "a WWII airplane factory: aircraft being assembled, other women "
            "and Rosies working with rivet guns, sparks flying. American "
            "flag hanging. Warm patriotic bold reds, whites, blues."
        ),
        "palette": "bold Rosie yellow background, red bandanna, blue coveralls",
    },
    {
        "id": "29",
        "year": "1947-1991",
        "title": "COLD WAR",
        "subtitle": "USA VS SOVIETS",
        "iconic": (
            "A dramatic split-scene: on the left, the American bald eagle with "
            "the American flag draped behind, star-spangled. On the right, "
            "the Soviet hammer-and-sickle emblem with the red Soviet flag. "
            "Between them, a globe with a bright red 'Iron Curtain' line "
            "carved across Europe. Symbolic nuclear missile silhouettes in "
            "background silos on both sides, and a black-and-white 'DUCK AND "
            "COVER' school-drill diagram at the corner."
        ),
        "palette": "USA red-white-blue vs USSR bright red, black divider",
    },
    {
        "id": "30",
        "year": "1950-1953",
        "title": "KOREAN WAR",
        "subtitle": "38TH PARALLEL",
        "iconic": (
            "A Korean War battlefield: American GIs in olive-green helmets, "
            "flak jackets and M1 Garand rifles crouching behind sandbags in "
            "the snow of the Korean mountains. A UN flag and American flag "
            "flying together. In the distance, a red-and-blue Korean peninsula "
            "map with a clear '38TH PARALLEL' line dividing it. Cold winter, "
            "bare trees, MASH tent in the background, a helicopter overhead."
        ),
        "palette": "cold snow blue, olive drab uniforms, warm campfire orange",
    },
    {
        "id": "31",
        "year": "1957",
        "title": "SPUTNIK",
        "subtitle": "SPACE RACE BEGINS",
        "iconic": (
            "Sputnik 1, the silvery Soviet satellite (a shiny metal sphere "
            "with four long radio antennae), orbiting above Earth. A "
            "curving Earth horizon below with the North American continent "
            "visible, blue oceans, white clouds. Stars sprinkled in the "
            "black cosmic void behind. Radio signal waves emanating in "
            "concentric circles. Dramatic, awe-inspiring 'shock of Sputnik' "
            "moment."
        ),
        "palette": "cosmic black, chrome silver, earth blue, star white",
    },
    {
        "id": "32",
        "year": "1962",
        "title": "CUBAN MISSILE CRISIS",
        "subtitle": "13 DAYS AT THE BRINK",
        "iconic": (
            "A Cold War map centered on Cuba with red dashed lines showing "
            "Soviet missile ranges from the island covering the eastern USA. "
            "In one corner, President John F. Kennedy in a suit at a desk "
            "with a red phone, worried expression. In the opposite corner, "
            "Soviet Premier Khrushchev at his own desk with a red phone. "
            "A large ominous mushroom cloud silhouette faintly implied "
            "behind the map. Tense, tense mood."
        ),
        "palette": "tense red, cold navy, map cream, ominous nuclear grey",
    },
    {
        "id": "33",
        "year": "1954",
        "title": "BROWN V. BOARD",
        "subtitle": "SEGREGATION ENDS",
        "iconic": (
            "The Supreme Court steps of Washington D.C., 1954. A black child "
            "and a white child holding hands, walking together up the marble "
            "steps toward the pillared courthouse, both carrying schoolbooks. "
            "Behind them, an old wooden 'WHITES ONLY' sign lies broken on "
            "the ground. Above, the gold inscription 'EQUAL JUSTICE UNDER "
            "LAW' on the courthouse frieze. Warm morning sun."
        ),
        "palette": "marble white, hopeful gold, courthouse cream, warm sun",
    },
    {
        "id": "34",
        "year": "1955",
        "title": "ROSA PARKS",
        "subtitle": "MONTGOMERY BUS BOYCOTT",
        "iconic": (
            "Rosa Parks — an African-American woman in a 1950s hat, coat and "
            "wire-rimmed glasses — seated calmly and dignified in the front "
            "of a Montgomery city bus, hands folded on her purse in her lap, "
            "eyes forward with quiet defiance. A frustrated white bus driver "
            "looking back at her. Other passengers in period dress reacting. "
            "'MONTGOMERY CITY LINES' visible on the bus wall. Warm interior "
            "light."
        ),
        "palette": "warm bus interior brown, dignified navy, tan coat",
    },
    {
        "id": "35",
        "year": "1964",
        "title": "CIVIL RIGHTS ACT",
        "subtitle": "I HAVE A DREAM",
        "iconic": (
            "Dr. Martin Luther King Jr. at the Lincoln Memorial podium, "
            "1963-64, arm raised delivering the 'I Have a Dream' speech, "
            "microphones in front of him. Behind him, the giant marble "
            "seated statue of Abraham Lincoln. Below the podium, an enormous "
            "diverse crowd of civil rights marchers stretching down the "
            "reflecting pool toward the Washington Monument. Bright warm "
            "sunshine, hopeful mood."
        ),
        "palette": "marble white, warm gold sun, hopeful sky blue, dignified navy",
    },
    {
        "id": "36",
        "year": "1969",
        "title": "APOLLO 11",
        "subtitle": "MEN ON THE MOON",
        "iconic": (
            "An astronaut in a bulky white Apollo spacesuit with a golden "
            "reflective visor and 'USA' patch, standing on the grey cratered "
            "lunar surface. A single boot print in the moon dust in front of "
            "him. He plants an American flag with a rigid horizontal bar. "
            "The Lunar Module (LEM) sits nearby. Above him, a jet-black sky "
            "and — dramatically — a huge blue-and-green Earth hanging in "
            "the distance."
        ),
        "palette": "moon grey, spacesuit white, deep black space, blue-green earth, red-white-blue flag",
    },
    {
        "id": "37",
        "year": "1989",
        "title": "BERLIN WALL FALLS",
        "subtitle": "END OF COLD WAR",
        "iconic": (
            "The Berlin Wall being torn down, November 1989. A large concrete "
            "graffiti-covered section of the Berlin Wall is being physically "
            "broken by joyous Berliners with sledgehammers and pickaxes, "
            "chunks of concrete flying off. Young people sitting on top of "
            "the wall waving West and East German flags together. Confetti, "
            "flashing camera bulbs, tearful hugs. In the background, the "
            "Brandenburg Gate. Nighttime with warm orange floodlights."
        ),
        "palette": "warm celebration orange, concrete grey, colorful graffiti, dark night",
    },
    {
        "id": "38",
        "year": "1990S",
        "title": "THE INTERNET",
        "subtitle": "WORLD WIDE WEB",
        "iconic": (
            "A 1990s home office scene: an early beige CRT monitor showing "
            "an early web browser page with 'HTTP://' visible, spinning "
            "'@' symbols and rainbow globe icons floating out of the screen "
            "as if the internet is bursting into the world. A dial-up modem "
            "with blinking green LEDs. A person's silhouette clicking a "
            "chunky mouse. Beams of glowing rainbow light forming a globe "
            "with network node connections around it in the sky behind."
        ),
        "palette": "beige computer, glowing rainbow web, dial-up green LEDs",
    },
    {
        "id": "39",
        "year": "2007",
        "title": "THE SMARTPHONE",
        "subtitle": "IPHONE REVOLUTION",
        "iconic": (
            "A first-generation iPhone floating in a spotlight, chunky pixel "
            "black bezels, silver metal frame, iconic circular Home button, "
            "the home screen showing the original grid of colorful app icons "
            "(phone, mail, safari, camera). Rays of light beam out from the "
            "screen, symbolizing app revolution. Around the phone, small "
            "floating pixel-art icons of a globe, a music note, a camera, a "
            "chat bubble. Dark modern background."
        ),
        "palette": "modern minimal black, chrome silver, glowing app icon rainbow",
    },
    {
        "id": "40",
        "year": "2021",
        "title": "JAMES WEBB TELESCOPE",
        "subtitle": "DEEPEST IMAGES",
        "iconic": (
            "The James Webb Space Telescope floating in deep space, its "
            "iconic golden hexagonal mirror array (18 gold hexagons) fully "
            "unfolded and reflecting starlight, and its silver sunshield "
            "sails spread wide. Behind it, an incredibly rich starfield "
            "with a colorful nebula (like Carina) and multiple distant "
            "galaxies with spiral arms. Bright cosmic dust and gas. Deep "
            "black space with vibrant colored nebula clouds."
        ),
        "palette": "gold mirrors, silver sunshield, deep black space, nebula magenta and teal",
    },
]


assert len(SCENES) == 40, f"Expected 40 scenes, got {len(SCENES)}"
