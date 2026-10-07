// Sample location tree (country → region → appellations) and grape list, from the approved mockup.
// The plan in the design notes is to replace this with a bundled list built from EU eAmbrosia plus Wikidata.
export const GEO = {
  'France':{'Bordeaux':['Pauillac','Margaux','Saint-Julien','Saint-Émilion Grand Cru','Pomerol','Pessac-Léognan','Graves','Sauternes'],'Burgundy':['Chablis','Gevrey-Chambertin','Meursault','Pommard','Puligny-Montrachet'],'Champagne':['Champagne'],'Loire':['Vouvray','Sancerre','Chinon'],'Rhône':['Côtes du Rhône','Châteauneuf-du-Pape','Hermitage','Crozes-Hermitage'],'Provence':['Bandol','Côtes de Provence'],'Alsace':['Alsace','Alsace Grand Cru']},
  'Italy':{'Piedmont':['Barolo','Barbaresco','Barbera d\'Alba'],'Tuscany':['Chianti Classico','Brunello di Montalcino','Bolgheri'],'Veneto':['Amarone della Valpolicella','Soave','Prosecco']},
  'Spain':{'Rioja':['Rioja'],'Castilla y León':['Ribera del Duero','Rueda','Toro'],'Catalonia':['Priorat','Cava','Penedès']},
  'Germany':{'Mosel':['Mosel'],'Rheingau':['Rheingau'],'Pfalz':['Pfalz']},
  'Portugal':{'Douro':['Douro','Port'],'Minho':['Vinho Verde']},
  'Belgium':{'Flanders':['Hageland','Haspengouw','Heuvelland'],'Wallonia':['Côtes de Sambre et Meuse','Crémant de Wallonie']},
  'Lebanon':{'Bekaa Valley':['Bekaa Valley']},
  'New Zealand':{'Marlborough':['Marlborough'],'Central Otago':['Central Otago'],'Hawke\'s Bay':['Hawke\'s Bay']},
  'United States':{'California':['Napa Valley','Sonoma County','Alexander Valley','Dry Creek Valley'],'Oregon':['Willamette Valley']},
  'Australia':{'South Australia':['Barossa Valley','McLaren Vale','Coonawarra']},
  'Argentina':{'Mendoza':['Luján de Cuyo','Uco Valley']},
  'South Africa':{'Western Cape':['Stellenbosch','Swartland']}
};
export const GRAPES = ['Cabernet Sauvignon','Merlot','Cabernet Franc','Petit Verdot','Malbec','Pinot Noir','Pinot Meunier','Syrah','Grenache','Mourvèdre','Cinsault','Carignan','Tempranillo','Garnacha','Graciano','Mazuelo','Nebbiolo','Sangiovese','Barbera','Corvina','Zinfandel','Petite Sirah','Touriga Nacional','Touriga Franca','Tinta Roriz','Chardonnay','Sauvignon Blanc','Sémillon','Muscadelle','Chenin Blanc','Riesling','Gewürztraminer','Pinot Gris','Viognier','Albariño','Glera','Muscat'];
