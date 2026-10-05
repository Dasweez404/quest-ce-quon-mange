// Data ported verbatim from the Claude Design prototype (Qu'est ce qu'on mange.dc.html)
const DATA = [
  {id:'plats', name:'Plats génériques', emoji:'🍽', items:['Frites','Burger','Pad Thai','Cordon Bleu','Nuggets','Filets de poulet','Pizza','Couscous','Salade','Pates froides','Pates bolo','Pates carbo','Semoule ratatouille','Soupe','Purée','Pates poulet','Riz poisson','Tartiflette','Gratin dauphinois','Lentilles','Croque monsieur','Hot Dog','Fajitas','Tacos','Riz curry','Gratin','Gratin d\'aubergine','Oeufs au plat','Oeuf à la coque','Kebab','Wrap','Tenders','Nems','Mafé','Foutu','Sushi','Gyozas','Wok','Hachis Parmentier Canard','Saumon','Filet de cabillaud','Emanadas','Fish and chips','Brandade','Tempuras','Mac and cheese','Tomate farcies','Rosties','Soupe grattinée','Roti de boeuf','Roti de porc','Boeuf bourguignon','Lasagnes','Samosa','Hacras','Raviolis','Ribs','Escalope','Porc au caramel','Friands boeuf','Steak frites','Steak sauce au poivre','Poulet rôti','Poulet basquaise','Poulet tikka masala','Poulet teriyaki','Poulet katsu','Poulet satay','Blanquette de veau','Veau marengo','Côte de porc moutarde','Travers de porc caramélisés','Tajine de poulet','Tajine d’agneau','Moussaka','Chili con carne','Chili sin carne','Bœuf sauté aux légumes','Bœuf teriyaki','Bœuf mongol','Steak tartare','Carpaccio de bœuf','Boulettes de bœuf sauce tomate','Kefta','Poulet rôti pommes de terre','Poisson pané','Saumon teriyaki','Saumon à la crème','Saumon grillé','Cabillaud à la tomate','Cabillaud en papillote','Moules-frites','Moules marinières','Crevettes au curry','Crevettes à l’ail','Crevettes coco','Calamars à la romaine','Poke bowl','Chirashi','Ramen','Udon sautés','Bibimbap','Yakitori','Bao','Dim sum','Pad see ew','Pho','Curry japonais','Curry de légumes','Dahl de lentilles','Falafels avec riz','Shakshuka','Œufs cocotte','Omelette','Quiche lorraine','Quiche aux légumes','Tourte à la viande','Parmentier de saumon','Parmentier de bœuf','Gratin de courgettes','Gratin de chou-fleur','Gratin de pâtes','Gratin de fruits de mer','Cannellonis','Pâtes pesto','Pâtes 4 fromages','Pâtes arrabbiata','Pâtes aux champignons','Pâtes saumon crème','Risotto aux champignons','Risotto au poulet','Risotto aux fruits de mer','Paella','Arancini','Polenta crémeuse','Galettes de pommes de terre','Pommes de terre sautées avec œufs','Piadina','Quesadillas','Enchiladas','Burritos','Nachos gratinés','Empanadas au poulet','Pastilla au poulet','Poke saumon','Sandwich club','Bagel saumon','Panini','Croque-madame','Bruschetta','Welsh','Flammekueche','Galette bretonne','Raclette','Mont d’Or au four','Pot-au-feu','Cassoulet','Blanquette de poulet','Coq au vin','Bœuf-carottes','Potée','Quenelles sauce tomate','Andouillette','Saucisse-purée','Saucisse-lentilles']},
  {id:'legumes', name:'Légumes', emoji:'🥕', items:['Carotte','Courgette','Aubergine','Tomate','Concombre','Poivron','Brocoli','Chou-fleur','Chou blanc','Chou rouge','Chou de Bruxelles','Épinards','Petit pois','Asperge','Artichaut','Poireau','Oignon','Ail','Échalote','Radis','Navet','Betterave','Panais','Céleri','Fenouil','Potiron','Courge butternut','Endive','Blette','Maïs','Salade','Olives','Champignon','Oignons frits']},
  {id:'feculents', name:'Féculents & céréales', emoji:'🍚', items:['Riz','Semoule','Boulgour','Quinoa','Blé','Pomme de terre','Patate douce','Manioc','Igname','Topinambour','Spaghetti','Penne','Fusilli','Farfalle','Macaroni','Tagliatelles','Linguine','Fettuccine','Coquillettes','Conchiglie','Cannelloni','Lasagnes','Ravioli','Gnocchi','Udon']},
  {id:'legumineuses', name:'Légumineuses', emoji:'🫘', items:['Lentilles vertes','Lentilles corail','Lentilles blondes','Pois chiches','Haricots rouges','Haricots blancs','Haricots mungo','Fèves','Soja','Edamame']},
  {id:'epices', name:'Herbes & épices', emoji:'🌿', items:['Mexicaine','Basilic','Persil','Coriandre','Menthe','Ciboulette','Thym','Romarin','Origan','Aneth','Sauge','Fenouil','Paprika','Curry','Curcuma','Cumin','Cannelle','Muscade','Gingembre','Cardamome','Clou de girofle','Safran','Anis étoilé','Piment de Cayenne','Piment d\'Espelette','Poivre','Barbecue','Mélange quatre-épices','Ras el-hanout']},
  {id:'sauces', name:'Crèmes, sauces & tartinades', emoji:'🥫', items:['Sauce tomate','Coulis de tomate','Sauce pesto','Pesto rosso','Sauce béchamel','Crème fraiche','Sauce au poivre','Sauce champignon','Sauce curry','Sauce moutarde','Sauce barbecue','Sauce burger','Sauce béarnaise','Sauce hollandaise','Sauce tartare','Sauce cocktail','Sauce soja','Sauce teriyaki','Sauce aigre-douce','Sauce chili','Sauce sriracha','Harissa','Tzatziki','Houmous','Guacamole','Tapenade d’olives','Caviar d’aubergine','Crème d’artichaut','Crème de poivron','Crème de courgette','Crème de champignon','Crème d’ail','Crème de feta','Fromage frais aux herbes','Rillettes de thon','Rillettes de saumon','Rillettes de poulet','Tarama','Caviar de tomates séchées','Beurre de cacahuète','Crème de marrons','Confit d’oignons','Moutarde','Mayonnaise','Ketchup','Sauce algérienne','Sauce andalouse','Sauce hamburger','Sauce onion cream']},
  {id:'viandes', name:'Viandes, fruits de mer, poisson', emoji:'🍗', items:['Poulet','Dinde','Bœuf','Veau','Porc','Agneau','Canard','Steak haché','Bavette','Entrecôte','Faux-filet','Filet mignon','Côte de porc','Côte d’agneau','Escalope de poulet','Escalope de dinde','Jambon blanc','Jambon cru','Bacon','Saumon','Thon','Cabillaud','Anchois','Lieu noir','Crevettes','Gambas','Moules','Calamar','Poulpe','Noix de Saint-Jacques','Œufs','Tofu','Jambon de poulet','Jambon de dinde','Saucisse','Merguez','Boulettes de viande','Surimi','Chorizo','Rosette','Fromage']},
  {id:'aperofroid', name:'Apéro froid', emoji:'🫒', items:['Olives vertes','Olives noires','Tomates cerises','Billes de mozzarella','Feta en dés','Dés de comté','Dés de cheddar','Roulés de jambon au fromage frais','Roulés de saumon fumé','Bouchées de concombre au fromage frais','Brochettes tomate-mozzarella','Brochettes de melon et jambon cru','Avocat en bouchées','Radis au fromage frais','Champignons farcis froids','Artichauts marinés','Poivrons marinés','Aubergines grillées marinées','Cœurs de palmier','Maïs grillé','Houmous avec crudités','Guacamole avec crudités','Tapenade avec légumes']},
  {id:'aperochaud', name:'Apéro chaud', emoji:'🔥', items:['Mini-feuilletés au fromage','Mini-feuilletés au pesto','Mini-quiches','Mini-pizzas','Mini-croque-monsieur','Gougères au fromage','Champignons farcis','Poivrons farcis','Courgettes grillées','Aubergines grillées','Mozzarella sticks','Halloumi grillé','Camembert rôti','Brie rôti','Mini-saucisses grillées','Boulettes de viande','Ailes de poulet','Nuggets de poulet','Crevettes à l\'ail','Crevettes panées','Calamars frits','Falafels','Samoussas','Nems','Accras de morue','Onion Rings']}
];

const DISHES = [
  {n:'Pâtes bolo', t:['Spaghetti','Bœuf','Sauce tomate','Oignon','Carotte']},
  {n:'Pâtes carbo', t:['Spaghetti','Bacon','Crème fraiche','Œufs','Fromage']},
  {n:'Pizza', t:['Sauce tomate','Fromage','Origan','Champignon']},
  {n:'Burger', t:['Steak haché','Fromage','Oignon','Sauce burger','Frites']},
  {n:'Poulet rôti', t:['Poulet','Pomme de terre','Thym','Ail']},
  {n:'Lasagnes', t:['Lasagnes','Bœuf','Sauce tomate','Sauce béchamel','Fromage']},
  {n:'Gratin dauphinois', t:['Pomme de terre','Crème fraiche','Ail','Muscade','Fromage']},
  {n:'Tartiflette', t:['Pomme de terre','Bacon','Oignon','Fromage','Crème fraiche']},
  {n:'Couscous', t:['Semoule','Poulet','Merguez','Carotte','Courgette','Pois chiches','Ras el-hanout']},
  {n:'Chili con carne', t:['Bœuf','Haricots rouges','Sauce tomate','Poivron','Cumin','Riz']},
  {n:'Dahl de lentilles', t:['Lentilles corail','Curry','Oignon','Curcuma','Riz','Gingembre']},
  {n:'Risotto aux champignons', t:['Riz','Champignon','Crème fraiche','Fromage','Échalote']},
  {n:'Curry de légumes', t:['Curry','Courgette','Poivron','Carotte','Riz','Curcuma']},
  {n:'Poulet tikka masala', t:['Poulet','Curry','Crème fraiche','Riz','Gingembre','Coriandre']},
  {n:'Poulet basquaise', t:['Poulet','Poivron','Tomate','Oignon','Riz','Paprika']},
  {n:'Blanquette de veau', t:['Veau','Crème fraiche','Carotte','Champignon','Riz']},
  {n:'Bœuf bourguignon', t:['Bœuf','Carotte','Oignon','Champignon','Thym','Pomme de terre']},
  {n:'Hachis Parmentier Canard', t:['Canard','Pomme de terre','Oignon','Fromage']},
  {n:'Moussaka', t:['Aubergine','Bœuf','Sauce tomate','Sauce béchamel','Origan']},
  {n:'Ratatouille & semoule', t:['Aubergine','Courgette','Poivron','Tomate','Semoule','Thym']},
  {n:'Shakshuka', t:['Œufs','Tomate','Poivron','Oignon','Cumin','Paprika']},
  {n:'Quiche lorraine', t:['Œufs','Bacon','Crème fraiche','Fromage']},
  {n:'Croque monsieur', t:['Jambon blanc','Fromage','Sauce béchamel']},
  {n:'Poke bowl', t:['Riz','Saumon','Avocat en bouchées','Concombre','Sauce soja','Edamame']},
  {n:'Ramen', t:['Udon','Poulet','Œufs','Sauce soja','Gingembre','Champignon']},
  {n:'Pad Thai', t:['Udon','Crevettes','Œufs','Beurre de cacahuète','Sauce soja']},
  {n:'Gyozas', t:['Porc','Chou blanc','Gingembre','Sauce soja']},
  {n:'Sushi', t:['Riz','Saumon','Concombre','Avocat en bouchées','Sauce soja']},
  {n:'Wok de bœuf aux légumes', t:['Bœuf','Poivron','Brocoli','Sauce soja','Riz','Gingembre']},
  {n:'Tacos', t:['Poulet','Sauce algérienne','Fromage','Frites','Oignon']},
  {n:'Fajitas', t:['Poulet','Poivron','Oignon','Mexicaine','Fromage']},
  {n:'Quesadillas', t:['Fromage','Poulet','Poivron','Guacamole']},
  {n:'Moules-frites', t:['Moules','Frites','Échalote','Persil','Crème fraiche']},
  {n:'Saumon grillé', t:['Saumon','Riz','Citron','Aneth','Brocoli']},
  {n:'Cabillaud en papillote', t:['Cabillaud','Courgette','Tomate','Thym','Pomme de terre']},
  {n:'Crevettes au curry', t:['Crevettes','Curry','Riz','Crème fraiche','Coriandre']},
  {n:'Paella', t:['Riz','Poulet','Crevettes','Moules','Poivron','Safran']},
  {n:'Pâtes pesto', t:['Penne','Sauce pesto','Fromage','Basilic']},
  {n:'Pâtes aux champignons', t:['Tagliatelles','Champignon','Crème fraiche','Ail','Persil']},
  {n:'Pâtes saumon crème', t:['Tagliatelles','Saumon','Crème fraiche','Aneth']},
  {n:'Mac and cheese', t:['Macaroni','Fromage','Sauce béchamel','Muscade']},
  {n:'Gratin de courgettes', t:['Courgette','Crème fraiche','Fromage','Œufs']},
  {n:'Tomates farcies', t:['Tomate','Bœuf','Riz','Oignon','Persil']},
  {n:'Soupe de légumes', t:['Carotte','Poireau','Pomme de terre','Oignon','Céleri']},
  {n:'Omelette', t:['Œufs','Fromage','Champignon','Ciboulette']},
  {n:'Raclette', t:['Fromage','Pomme de terre','Jambon cru','Rosette','Olives vertes']},
  {n:'Falafels avec riz', t:['Pois chiches','Coriandre','Cumin','Riz','Tzatziki']},
  {n:'Tajine de poulet', t:['Poulet','Olives','Carotte','Ras el-hanout','Semoule']},
  {n:'Steak frites', t:['Bavette','Frites','Sauce au poivre']},
  {n:'Saucisse-lentilles', t:['Saucisse','Lentilles vertes','Carotte','Oignon','Thym']}
];

const ALL_DISHES = DISHES.concat(
  DATA[0].items.filter(n => !DISHES.some(d => d.n === n)).map(n => ({ n, t:[] }))
);

const TPL = [
  (p,f,l,s,h) => p && f ? p + ' ' + (h ? 'au ' + h.toLowerCase() : 'rôti') + ', ' + f.toLowerCase() : null,
  (p,f,l,s,h) => p && l ? p + ' sauté aux ' + l.toLowerCase() : null,
  (p,f,l,s,h) => p && s ? p + ' ' + s.toLowerCase().replace(/^sauce /, 'sauce ') + (f ? ', ' + f.toLowerCase() : '') : null,
  (p,f,l,s,h) => f && l ? 'Poêlée de ' + f.toLowerCase() + ' et ' + l.toLowerCase() : null,
  (p,f,l,s,h) => l && s ? l + ' rôti' + ', ' + s.toLowerCase() : null,
  (p,f,l,s,h) => p && l && h ? 'Mijoté de ' + p.toLowerCase() + ' aux ' + l.toLowerCase() + ' et ' + h.toLowerCase() : null
];

const HINTS = {0:'Neutre pour l’instant.',1:'Dans tes envies.',2:'Écarté pour ce soir.'};

export { DATA, DISHES, ALL_DISHES, TPL, HINTS };
