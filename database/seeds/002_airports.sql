-- =============================================================================
-- Weight'Aty — Aéroports / villes de référence
-- -----------------------------------------------------------------------------
-- Données de référence (codes IATA réels) utilisées par l'autocomplétion des
-- champs Départ et Destination. Réexécutable sans effet de bord.
-- =============================================================================

INSERT INTO airports (iata_code, city, country, name)
VALUES
  -- Océan Indien
  ('MRU', 'Maurice',        'Maurice',              'Sir Seewoosagur Ramgoolam'),
  ('RUN', 'La Réunion',     'France',               'Roland Garros'),
  ('DZA', 'Mayotte',        'France',               'Dzaoudzi-Pamandzi'),
  ('TNR', 'Antananarivo',   'Madagascar',           'Ivato'),
  ('HAH', 'Moroni',         'Comores',              'Prince Saïd Ibrahim'),
  ('SEZ', 'Victoria',       'Seychelles',           'Seychelles International'),
  -- France
  ('CDG', 'Paris',          'France',               'Charles de Gaulle'),
  ('ORY', 'Paris',          'France',               'Orly'),
  ('NCE', 'Nice',           'France',               'Côte d''Azur'),
  ('LYS', 'Lyon',           'France',               'Saint-Exupéry'),
  ('MRS', 'Marseille',      'France',               'Provence'),
  ('TLS', 'Toulouse',       'France',               'Blagnac'),
  ('BOD', 'Bordeaux',       'France',               'Mérignac'),
  ('NTE', 'Nantes',         'France',               'Atlantique'),
  ('FDF', 'Fort-de-France', 'France',               'Aimé Césaire'),
  ('PTP', 'Pointe-à-Pitre', 'France',               'Guadeloupe - Pôle Caraïbes'),
  ('CAY', 'Cayenne',        'France',               'Félix Éboué'),
  -- Europe
  ('LHR', 'Londres',        'Royaume-Uni',          'Heathrow'),
  ('LGW', 'Londres',        'Royaume-Uni',          'Gatwick'),
  ('FRA', 'Francfort',      'Allemagne',            'Francfort'),
  ('MUC', 'Munich',         'Allemagne',            'Munich'),
  ('AMS', 'Amsterdam',      'Pays-Bas',             'Schiphol'),
  ('BRU', 'Bruxelles',      'Belgique',             'Zaventem'),
  ('GVA', 'Genève',         'Suisse',               'Genève'),
  ('ZRH', 'Zurich',         'Suisse',               'Zurich'),
  ('MAD', 'Madrid',         'Espagne',              'Barajas'),
  ('BCN', 'Barcelone',      'Espagne',              'El Prat'),
  ('LIS', 'Lisbonne',       'Portugal',             'Humberto Delgado'),
  ('FCO', 'Rome',           'Italie',               'Fiumicino'),
  ('MXP', 'Milan',          'Italie',               'Malpensa'),
  ('VIE', 'Vienne',         'Autriche',             'Schwechat'),
  -- Afrique
  ('JNB', 'Johannesburg',   'Afrique du Sud',       'O.R. Tambo'),
  ('CPT', 'Le Cap',         'Afrique du Sud',       'Cape Town'),
  ('DUR', 'Durban',         'Afrique du Sud',       'King Shaka'),
  ('NBO', 'Nairobi',        'Kenya',                'Jomo Kenyatta'),
  ('MBA', 'Mombasa',        'Kenya',                'Moi'),
  ('ADD', 'Addis-Abeba',    'Éthiopie',             'Bole'),
  ('CAI', 'Le Caire',       'Égypte',               'Le Caire'),
  ('CMN', 'Casablanca',     'Maroc',                'Mohammed V'),
  ('RAK', 'Marrakech',      'Maroc',                'Ménara'),
  ('ALG', 'Alger',          'Algérie',              'Houari Boumediene'),
  ('TUN', 'Tunis',          'Tunisie',              'Carthage'),
  ('DKR', 'Dakar',          'Sénégal',              'Blaise Diagne'),
  ('ABJ', 'Abidjan',        'Côte d''Ivoire',       'Félix Houphouët-Boigny'),
  ('CKY', 'Conakry',        'Guinée',               'Ahmed Sékou Touré'),
  ('BKO', 'Bamako',         'Mali',                 'Modibo Keïta'),
  ('OUA', 'Ouagadougou',    'Burkina Faso',         'Ouagadougou'),
  ('LFW', 'Lomé',           'Togo',                 'Gnassingbé Eyadéma'),
  ('COO', 'Cotonou',        'Bénin',                'Cadjehoun'),
  ('DLA', 'Douala',         'Cameroun',             'Douala'),
  ('LBV', 'Libreville',     'Gabon',                'Léon-Mba'),
  ('FIH', 'Kinshasa',       'RDC',                  'N''djili'),
  ('KGL', 'Kigali',         'Rwanda',               'Kigali'),
  ('DAR', 'Dar es Salaam',  'Tanzanie',             'Julius Nyerere'),
  ('LOS', 'Lagos',          'Nigeria',              'Murtala Muhammed'),
  ('ACC', 'Accra',          'Ghana',                'Kotoka'),
  -- Moyen-Orient / Asie
  ('DXB', 'Dubaï',          'Émirats arabes unis',  'Dubaï International'),
  ('DOH', 'Doha',           'Qatar',                'Hamad'),
  ('IST', 'Istanbul',       'Turquie',              'Istanbul'),
  ('BOM', 'Mumbai',         'Inde',                 'Chhatrapati Shivaji'),
  ('DEL', 'Delhi',          'Inde',                 'Indira Gandhi'),
  ('BKK', 'Bangkok',        'Thaïlande',            'Suvarnabhumi'),
  ('SIN', 'Singapour',      'Singapour',            'Changi'),
  ('HKG', 'Hong Kong',      'Chine',                'Hong Kong International'),
  ('PEK', 'Pékin',          'Chine',                'Capital'),
  -- Amériques / Océanie
  ('JFK', 'New York',       'États-Unis',           'John F. Kennedy'),
  ('YUL', 'Montréal',       'Canada',               'Pierre-Elliott-Trudeau'),
  ('GRU', 'São Paulo',      'Brésil',               'Guarulhos'),
  ('SYD', 'Sydney',         'Australie',            'Kingsford Smith'),
  ('MEL', 'Melbourne',      'Australie',            'Tullamarine')
ON CONFLICT (iata_code) DO NOTHING;
