// Curated wine-location suggestions (country -> region -> appellations/subregions).
// These autocomplete seeds are not complete legal registers. References:
// EU eAmbrosia: https://ec.europa.eu/agriculture/eambrosia/geographical-indications-register/
// New Zealand Wine: https://www.nzwine.com/en/regions/
// Wine Australia: https://www.wineaustralia.com/labelling/register-of-protected-geographical-indications-and-other-terms
// US TTB AVAs: https://www.ttb.gov/wine/american-viticultural-area-ava
// Wines of South Africa: https://www.wosa.co.za/
export const GEO = {
  'Argentina': {
    'Mendoza': ['Mendoza', 'Luján de Cuyo', 'Maipú', 'Uco Valley', 'Tupungato', 'San Carlos', 'Tunuyán', 'San Rafael'],
    'San Juan': ['San Juan', 'Pedernal Valley', 'Tulum Valley', 'Zonda'],
    'La Rioja': ['La Rioja', 'Famatina Valley'],
    'Salta': ['Salta', 'Cafayate', 'Calchaquí Valleys'],
    'Patagonia': ['Patagonia', 'Río Negro', 'Neuquén', 'Chubut'],
    'Other regions': ['Catamarca', 'Tucumán', 'Jujuy']
  },
  'Australia': {
    'South Australia': ['Barossa Valley', 'Eden Valley', 'Clare Valley', 'McLaren Vale', 'Coonawarra', 'Adelaide Hills', 'Langhorne Creek', 'Riverland', 'Padthaway', 'Limestone Coast'],
    'Victoria': ['Yarra Valley', 'Mornington Peninsula', 'Geelong', 'Rutherglen', 'Heathcote', 'Bendigo', 'Grampians', 'King Valley', 'Macedon Ranges'],
    'New South Wales': ['Hunter Valley', 'Mudgee', 'Orange', 'Cowra', 'Riverina', 'Canberra District'],
    'Western Australia': ['Margaret River', 'Great Southern', 'Swan Valley', 'Pemberton', 'Geographe', 'Manjimup'],
    'Tasmania': ['Tasmania', 'Coal River Valley', 'Tamar Valley', 'East Coast'],
    'Queensland': ['Granite Belt', 'South Burnett']
  },
  'Austria': {
    'Niederösterreich': ['Wachau', 'Kamptal', 'Kremstal', 'Traisental', 'Wagram', 'Weinviertel', 'Carnuntum', 'Thermenregion'],
    'Burgenland': ['Neusiedlersee', 'Leithaberg', 'Mittelburgenland', 'Eisenberg', 'Rosalia'],
    'Steiermark': ['Südsteiermark', 'Weststeiermark', 'Vulkanland Steiermark'],
    'Wien': ['Wien', 'Wiener Gemischter Satz']
  },
  'Belgium': {
    'Flanders': ['Hageland', 'Haspengouw', 'Heuvelland', 'Maasvallei Limburg'],
    'Wallonia': ['Côtes de Sambre et Meuse', 'Crémant de Wallonie']
  },
  'Brazil': {
    'Rio Grande do Sul': ['Vale dos Vinhedos', 'Campanha Gaúcha', 'Serra Gaúcha', 'Pinto Bandeira', 'Farroupilha'],
    'Santa Catarina': ['São Joaquim', 'Vale do Rio do Peixe'],
    'Pernambuco and Bahia': ['Vale do São Francisco']
  },
  'Bulgaria': {
    'Danubian Plain': ['Suhindol', 'Pleven', 'Svishtov'],
    'Thracian Lowland': ['Thracian Lowland', 'Sakar', 'Asenovgrad'],
    'Black Sea': ['Varna', 'Pomorie'],
    'Struma Valley': ['Melnik']
  },
  'Canada': {
    'British Columbia': ['Okanagan Valley', 'Similkameen Valley', 'Fraser Valley', 'Vancouver Island', 'Gulf Islands'],
    'Ontario': ['Niagara Peninsula', 'Niagara-on-the-Lake', 'Prince Edward County', 'Lake Erie North Shore'],
    'Quebec': ['Brome-Missisquoi', 'Montérégie', 'Eastern Townships'],
    'Nova Scotia': ['Annapolis Valley', 'Gaspereau Valley']
  },
  'Chile': {
    'Atacama': ['Copiapó', 'Huasco'],
    'Coquimbo': ['Elqui Valley', 'Limarí Valley', 'Choapa Valley'],
    'Aconcagua': ['Aconcagua Valley', 'Casablanca Valley', 'San Antonio Valley', 'Leyda Valley'],
    'Central Valley': ['Maipo Valley', 'Rapel Valley', 'Cachapoal Valley', 'Colchagua Valley', 'Curicó Valley', 'Maule Valley'],
    'Southern Chile': ['Itata Valley', 'Bío-Bío Valley', 'Malleco Valley']
  },
  'China': {
    'Ningxia': ['Helan Mountain East Foothills', 'Qingtongxia', 'Yinchuan'],
    'Shandong': ['Qingdao', 'Penglai'],
    'Xinjiang': ['Yanqi Basin', 'Hoxud'],
    'Hebei': ['Changli', 'Huailai']
  },
  'Croatia': {
    'Istria and Kvarner': ['Istria', 'Hrvatsko Primorje'],
    'Dalmatia': ['Pelješac', 'Dingač', 'Postup', 'Hvar', 'Korčula'],
    'Continental Croatia': ['Plešivica', 'Moslavina', 'Slavonia', 'Podunavlje']
  },
  'France': {
    'Alsace': ['Alsace', 'Alsace Grand Cru', 'Crémant d’Alsace'],
    'Beaujolais': ['Beaujolais', 'Beaujolais-Villages', 'Morgon', 'Moulin-à-Vent', 'Fleurie', 'Régnié', 'Juliénas', 'Brouilly'],
    'Bordeaux': ['Bordeaux', 'Médoc', 'Haut-Médoc', 'Pauillac', 'Margaux', 'Saint-Julien', 'Saint-Estèphe', 'Saint-Émilion Grand Cru', 'Pomerol', 'Pessac-Léognan', 'Graves', 'Sauternes', 'Barsac', 'Entre-Deux-Mers', 'Fronsac'],
    'Burgundy': ['Chablis', 'Gevrey-Chambertin', 'Morey-Saint-Denis', 'Chambolle-Musigny', 'Vougeot', 'Vosne-Romanée', 'Nuits-Saint-Georges', 'Aloxe-Corton', 'Beaune', 'Pommard', 'Volnay', 'Meursault', 'Puligny-Montrachet', 'Chassagne-Montrachet', 'Mercurey', 'Givry', 'Rully', 'Pouilly-Fuissé'],
    'Champagne': ['Champagne', 'Côte des Blancs', 'Montagne de Reims', 'Vallée de la Marne', 'Côte des Bar'],
    'Corsica': ['Patrimonio', 'Ajaccio', 'Calvi', 'Figari', 'Porto-Vecchio'],
    'Jura': ['Arbois', 'Château-Chalon', 'L’Étoile', 'Côtes du Jura'],
    'Languedoc': ['Languedoc', 'Picpoul de Pinet', 'La Clape', 'Corbières', 'Minervois', 'Saint-Chinian', 'Faugères', 'Pic Saint-Loup', 'Terrasses du Larzac', 'Limoux'],
    'Loire Valley': ['Sancerre', 'Pouilly-Fumé', 'Menetou-Salon', 'Vouvray', 'Montlouis-sur-Loire', 'Chinon', 'Bourgueil', 'Saumur', 'Saumur-Champigny', 'Muscadet Sèvre et Maine', 'Anjou', 'Savennières', 'Coteaux du Layon'],
    'Provence': ['Bandol', 'Côtes de Provence', 'Cassis', 'Palette', 'Les Baux-de-Provence'],
    'Roussillon': ['Côtes du Roussillon', 'Collioure', 'Banyuls', 'Maury', 'Rivesaltes'],
    'Rhône Valley': ['Côtes du Rhône', 'Châteauneuf-du-Pape', 'Gigondas', 'Vacqueyras', 'Tavel', 'Lirac', 'Cairanne', 'Hermitage', 'Crozes-Hermitage', 'Côte-Rôtie', 'Condrieu', 'Saint-Joseph', 'Cornas'],
    'Savoie': ['Vin de Savoie', 'Chignin-Bergeron', 'Crépy', 'Seyssel']
  },
  'Georgia': {
    'Kakheti': ['Telavi', 'Kvareli', 'Kindzmarauli', 'Mukuzani', 'Tsinandali', 'Napareuli'],
    'Kartli': ['Ateni', 'Bolnisi'],
    'Imereti': ['Sviri'],
    'Racha-Lechkhumi': ['Khvanchkara', 'Tvishi']
  },
  'Germany': {
    'Ahr': ['Ahr'], 'Baden': ['Kaiserstuhl', 'Markgräflerland', 'Ortenau', 'Breisgau', 'Bodensee'],
    'Franken': ['Franken', 'Würzburg', 'Steigerwald'], 'Hessische Bergstraße': ['Hessische Bergstraße'],
    'Mittelrhein': ['Mittelrhein'], 'Mosel': ['Mosel', 'Saar', 'Ruwer'], 'Nahe': ['Nahe'],
    'Pfalz': ['Pfalz', 'Mittelhaardt', 'Südliche Weinstraße'], 'Rheingau': ['Rheingau'],
    'Rheinhessen': ['Rheinhessen', 'Wonnegau', 'Bingen'], 'Saale-Unstrut': ['Saale-Unstrut'],
    'Sachsen': ['Sachsen'], 'Württemberg': ['Württemberg', 'Remstal', 'Bodensee']
  },
  'Greece': {
    'Northern Greece': ['Naoussa', 'Amyndeon', 'Goumenissa', 'Drama'],
    'Central Greece': ['Attica', 'Nemea', 'Mantinia'],
    'Peloponnese': ['Nemea', 'Mantinia', 'Patras', 'Mavrodaphne of Patras'],
    'Aegean Islands': ['Santorini', 'Paros', 'Samos', 'Rhodes', 'Limnos'],
    'Ionian Islands': ['Robola of Kefalonia']
  },
  'Hungary': {
    'Tokaj': ['Tokaj', 'Tokaji Aszú', 'Tokaji Szamorodni'], 'Eger': ['Eger', 'Egri Bikavér'],
    'Villány': ['Villány', 'Villányi Franc'], 'Balaton': ['Badacsony', 'Balatonfüred-Csopak', 'Somló'],
    'Other regions': ['Szekszárd', 'Mátra', 'Sopron', 'Kunság']
  },
  'Israel': {
    'Galilee': ['Upper Galilee', 'Golan Heights'], 'Judean Hills': ['Judean Hills', 'Jerusalem Hills'],
    'Samson': ['Samson'], 'Negev': ['Ramat Arad', 'Mitzpe Ramon']
  },
  'Italy': {
    'Abruzzo': ['Montepulciano d’Abruzzo', 'Trebbiano d’Abruzzo', 'Cerasuolo d’Abruzzo'],
    'Apulia': ['Primitivo di Manduria', 'Salice Salentino', 'Castel del Monte', 'Locorotondo'],
    'Basilicata': ['Aglianico del Vulture'], 'Calabria': ['Cirò', 'Greco di Bianco'],
    'Campania': ['Taurasi', 'Fiano di Avellino', 'Greco di Tufo', 'Aglianico del Taburno'],
    'Emilia-Romagna': ['Lambrusco di Sorbara', 'Lambrusco Grasparossa di Castelvetro', 'Albana di Romagna'],
    'Friuli-Venezia Giulia': ['Collio', 'Colli Orientali del Friuli', 'Friuli Isonzo', 'Carso'],
    'Lazio': ['Frascati', 'Cesanese del Piglio', 'Est! Est!! Est!!! di Montefiascone'],
    'Liguria': ['Cinque Terre', 'Colli di Luni', 'Rossese di Dolceacqua'],
    'Lombardy': ['Franciacorta', 'Oltrepò Pavese', 'Valtellina Superiore', 'Sforzato di Valtellina'],
    'Marche': ['Verdicchio dei Castelli di Jesi', 'Verdicchio di Matelica', 'Rosso Conero', 'Rosso Piceno'],
    'Piedmont': ['Barolo', 'Barbaresco', 'Barbera d’Alba', 'Barbera d’Asti', 'Langhe', 'Roero', 'Gavi', 'Gattinara', 'Ghemme'],
    'Sardinia': ['Cannonau di Sardegna', 'Vermentino di Gallura', 'Carignano del Sulcis'],
    'Sicily': ['Etna', 'Cerasuolo di Vittoria', 'Marsala', 'Noto', 'Menfi'],
    'Trentino-Alto Adige': ['Trento', 'Alto Adige', 'Teroldego Rotaliano', 'Trentino'],
    'Tuscany': ['Chianti', 'Chianti Classico', 'Brunello di Montalcino', 'Vino Nobile di Montepulciano', 'Bolgheri', 'Morellino di Scansano', 'Carmignano'],
    'Umbria': ['Montefalco Sagrantino', 'Orvieto', 'Torgiano Rosso Riserva'],
    'Valle d’Aosta': ['Valle d’Aosta'], 'Veneto': ['Amarone della Valpolicella', 'Valpolicella', 'Soave', 'Prosecco', 'Bardolino', 'Breganze']
  },
  'Japan': {
    'Yamanashi': ['Katsunuma', 'Koshu'], 'Nagano': ['Kikyogahara', 'Chikumagawa'],
    'Hokkaido': ['Yoichi', 'Sorachi'], 'Yamagata': ['Yamagata']
  },
  'Lebanon': {'Bekaa Valley': ['Bekaa Valley', 'Baalbek'], 'Mount Lebanon': ['Batroun']},
  'Mexico': {
    'Baja California': ['Valle de Guadalupe', 'Valle de San Antonio de las Minas', 'Valle de Santo Tomás', 'Valle de San Vicente'],
    'Coahuila': ['Parras Valley'], 'Querétaro': ['Ezequiel Montes', 'Tequisquiapan']
  },
  'New Zealand': {
    'Auckland': ['Auckland', 'Waiheke Island', 'Matakana', 'Kumeu'],
    'Central Otago': ['Central Otago', 'Gibbston', 'Bannockburn', 'Cromwell Basin', 'Wanaka'],
    'Gisborne': ['Gisborne'], 'Hawke’s Bay': ['Hawke’s Bay', 'Bridge Pa Triangle', 'Gimblett Gravels'],
    'Marlborough': ['Marlborough', 'Awatere Valley', 'Wairau Valley'], 'Nelson': ['Nelson', 'Moutere Hills'],
    'North Canterbury': ['North Canterbury', 'Waipara Valley'], 'Northland': ['Northland'],
    'Waitaki Valley': ['Waitaki Valley North Otago'], 'Wairarapa': ['Wairarapa', 'Martinborough', 'Gladstone', 'Masterton']
  },
  'Portugal': {
    'Alentejo': ['Alentejo', 'Borba', 'Évora', 'Reguengos', 'Vidigueira'],
    'Algarve': ['Lagos', 'Portimão', 'Lagoa', 'Tavira'], 'Dão': ['Dão', 'Lafões'],
    'Douro': ['Douro', 'Port', 'Cima Corgo', 'Douro Superior', 'Baixo Corgo'],
    'Lisboa': ['Lisboa', 'Bucelas', 'Colares', 'Carcavelos', 'Óbidos', 'Alenquer'],
    'Madeira': ['Madeira', 'Madeirense'], 'Minho': ['Vinho Verde', 'Monção e Melgaço', 'Lima', 'Cávado', 'Ave'],
    'Península de Setúbal': ['Setúbal', 'Palmela'], 'Tejo': ['Tejo', 'Cartaxo', 'Almeirim'],
    'Trás-os-Montes': ['Trás-os-Montes'], 'Beira Interior': ['Beira Interior'], 'Bairrada': ['Bairrada']
  },
  'Romania': {
    'Moldova': ['Cotnari', 'Huşi', 'Iaşi', 'Odobeşti'],
    'Muntenia and Oltenia': ['Dealu Mare', 'Drăgăşani', 'Sâmbureşti'],
    'Transylvania': ['Târnave', 'Lechinţa'], 'Banat and Crişana': ['Recaş', 'Miniş-Măderat']
  },
  'South Africa': {
    'Breede River Valley': ['Worcester', 'Robertson', 'Breedekloof'],
    'Cape South Coast': ['Elgin', 'Walker Bay', 'Hemel-en-Aarde Valley', 'Cape Agulhas', 'Plettenberg Bay'],
    'Coastal Region': ['Stellenbosch', 'Paarl', 'Swartland', 'Durbanville', 'Constantia', 'Tulbagh', 'Franschhoek'],
    'Klein Karoo': ['Calitzdorp', 'Tradouw'], 'Olifants River': ['Citrusdal Mountain', 'Lutzville'],
    'Other regions': ['Cederberg', 'Orange River']
  },
  'Spain': {
    'Andalusia': ['Jerez-Xérès-Sherry', 'Manzanilla-Sanlúcar de Barrameda', 'Montilla-Moriles', 'Málaga'],
    'Aragon': ['Calatayud', 'Campo de Borja', 'Cariñena', 'Somontano'],
    'Castilla-La Mancha': ['La Mancha', 'Valdepeñas', 'Manchuela', 'Almansa', 'Méntrida'],
    'Castilla y León': ['Ribera del Duero', 'Rueda', 'Toro', 'Bierzo', 'Cigales', 'Arribes'],
    'Catalonia': ['Priorat', 'Cava', 'Penedès', 'Montsant', 'Costers del Segre', 'Conca de Barberà', 'Terra Alta'],
    'Galicia': ['Rías Baixas', 'Ribeiro', 'Ribeira Sacra', 'Valdeorras', 'Monterrei'],
    'La Rioja': ['Rioja', 'Rioja Alta', 'Rioja Alavesa', 'Rioja Oriental'], 'Navarra': ['Navarra'],
    'Basque Country': ['Txakoli de Getaria', 'Txakoli de Bizkaia', 'Txakoli de Álava'],
    'Valencia': ['Valencia', 'Utiel-Requena', 'Alicante', 'Jumilla'], 'Murcia': ['Jumilla', 'Yecla', 'Bullas'],
    'Canary Islands': ['Tacoronte-Acentejo', 'Valle de la Orotava', 'Lanzarote', 'La Palma'],
    'Balearic Islands': ['Binissalem', 'Pla i Llevant']
  },
  'Switzerland': {
    'Valais': ['Valais', 'Sion', 'Fully'], 'Vaud': ['Lavaux', 'La Côte', 'Chablais', 'Dézaley'],
    'Geneva': ['Mandement', 'Satigny'], 'Ticino': ['Mendrisiotto', 'Lugano'],
    'Three Lakes': ['Neuchâtel', 'Biel/Bienne', 'Vully'],
    'German-speaking Switzerland': ['Zürich', 'Graubünden', 'Schaffhausen']
  },
  'United Kingdom': {
    'England': ['Sussex', 'Kent', 'Surrey', 'Hampshire', 'Essex', 'Cornwall', 'Dorset'],
    'Wales': ['Monmouthshire', 'Glamorgan']
  },
  'United States': {
    'California': ['Napa Valley', 'Sonoma County', 'Alexander Valley', 'Dry Creek Valley', 'Russian River Valley', 'Paso Robles', 'Santa Barbara County', 'Santa Maria Valley', 'Santa Cruz Mountains', 'Lodi', 'Mendocino', 'Livermore Valley', 'Temecula Valley'],
    'Oregon': ['Willamette Valley', 'Dundee Hills', 'Eola-Amity Hills', 'Yamhill-Carlton', 'Umpqua Valley', 'Rogue Valley'],
    'Washington': ['Columbia Valley', 'Walla Walla Valley', 'Yakima Valley', 'Red Mountain', 'Horse Heaven Hills', 'Wahluke Slope', 'Puget Sound'],
    'New York': ['Finger Lakes', 'Long Island', 'North Fork of Long Island', 'Hudson River Region', 'Lake Erie'],
    'Virginia': ['Monticello', 'Shenandoah Valley', 'Middleburg', 'Virginia’s Eastern Shore'],
    'Texas': ['Texas Hill Country', 'High Plains', 'Texas Davis Mountains'],
    'Other states': ['Snake River Valley', 'Leelanau Peninsula', 'Upper Mississippi River Valley']
  },
  'Uruguay': {
    'Canelones': ['Canelones', 'Progreso', 'Las Piedras'],
    'Maldonado': ['Maldonado', 'Garzón', 'Punta del Este'],
    'Colonia': ['Carmelo', 'Colonia del Sacramento'],
    'Other regions': ['Montevideo', 'San José', 'Rivera']
  }
};

export const GRAPES = ['Cabernet Sauvignon','Merlot','Cabernet Franc','Petit Verdot','Malbec','Pinot Noir','Pinot Meunier','Syrah','Grenache','Mourvèdre','Cinsault','Carignan','Tempranillo','Garnacha','Graciano','Mazuelo','Nebbiolo','Sangiovese','Barbera','Corvina','Zinfandel','Petite Sirah','Touriga Nacional','Touriga Franca','Tinta Roriz','Chardonnay','Sauvignon Blanc','Sémillon','Muscadelle','Chenin Blanc','Riesling','Gewürztraminer','Pinot Gris','Viognier','Albariño','Glera','Muscat'];