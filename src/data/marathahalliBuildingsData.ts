// Real OpenStreetMap (OSM) 3D Building Dataset for Bengaluru Marathahalli Junction
// Derived from marathahalli_osm.xml, georeferenced to lat: 12.956840, lon: 77.701176

export interface LandmarkBuilding {
  id: string;
  name: string;
  bannerTitle: string;
  bannerSubtitle: string;
  brandColor: string;
  type: 'landmark' | 'techpark' | 'commercial' | 'retail' | 'apartments';
  facadeStyle: 'retail_banner' | 'glass_curtain' | 'commercial_grid' | 'residential_balcony';
  cx: number;
  cz: number;
  height: number;
  levels: number;
  pts: [number, number][];
}

export interface SurroundingBuilding {
  id: string;
  type: 'commercial' | 'retail' | 'apartments' | 'general';
  facadeStyle: 'retail_banner' | 'glass_curtain' | 'commercial_grid' | 'residential_balcony';
  color: string;
  cx: number;
  cz: number;
  height: number;
  levels: number;
  pts: [number, number][];
}

export const REAL_LANDMARKS: LandmarkBuilding[] = [
  {
    "id": "lm_brand_factory",
    "name": "Brand Factory Outlet",
    "bannerTitle": "BRAND FACTORY",
    "bannerSubtitle": "FLAT 20% - 70% OFF ON 200+ BRANDS",
    "brandColor": "#b91c1c",
    "type": "landmark",
    "facadeStyle": "retail_banner",
    "cx": -72.0,
    "cz": 44.0,
    "height": 26.0,
    "levels": 4,
    "pts": [
      [
        -15.0,
        -12.0
      ],
      [
        15.0,
        -12.0
      ],
      [
        15.0,
        12.0
      ],
      [
        -15.0,
        12.0
      ]
    ]
  },
  {
    "id": "lm_tanishq",
    "name": "Tanishq Jewellery",
    "bannerTitle": "TANISHQ",
    "bannerSubtitle": "A TATA PRODUCT \u2022 EXQUISITE JEWELLERY",
    "brandColor": "#1e3a5f",
    "type": "landmark",
    "facadeStyle": "retail_banner",
    "cx": -70.0,
    "cz": -32.0,
    "height": 24.0,
    "levels": 3,
    "pts": [
      [
        -14.0,
        -10.0
      ],
      [
        14.0,
        -10.0
      ],
      [
        14.0,
        10.0
      ],
      [
        -14.0,
        10.0
      ]
    ]
  },
  {
    "id": "lm_kalyan_jewellers",
    "name": "Kalyan Jewellers",
    "bannerTitle": "KALYAN JEWELLERS",
    "bannerSubtitle": "TRUST IS EVERYTHING \u2022 MUDHRA BRIDAL",
    "brandColor": "#78350f",
    "type": "landmark",
    "facadeStyle": "retail_banner",
    "cx": -145.0,
    "cz": -30.0,
    "height": 24.0,
    "levels": 3,
    "pts": [
      [
        -16.0,
        -10.0
      ],
      [
        16.0,
        -10.0
      ],
      [
        16.0,
        10.0
      ],
      [
        -16.0,
        10.0
      ]
    ]
  },
  {
    "id": "lm_safal",
    "name": "Safal Fresh",
    "bannerTitle": "SAFAL FRESH",
    "bannerSubtitle": "HORTICULTURE & FRESH PRODUCE",
    "brandColor": "#15803d",
    "type": "retail",
    "facadeStyle": "commercial_grid",
    "cx": 180.1,
    "cz": -31.0,
    "height": 18.0,
    "levels": 2,
    "pts": [
      [
        -8.1,
        2.43
      ],
      [
        -4.39,
        3.88
      ],
      [
        -0.83,
        5.19
      ],
      [
        0.84,
        5.55
      ],
      [
        2.57,
        5.24
      ],
      [
        3.85,
        4.4
      ],
      [
        4.98,
        3.3
      ],
      [
        7.44,
        -2.51
      ],
      [
        0.76,
        -5.85
      ],
      [
        2.94,
        -11.08
      ],
      [
        -1.98,
        -13.0
      ]
    ]
  },
  {
    "id": "lm_nalli",
    "name": "Nalli Silk Saree",
    "bannerTitle": "\u0ca8\u0cb3\u0ccd\u0cb3\u0cbf \u0cb8\u0cbf\u0cb2\u0ccd\u0c95\u0ccd\u0cb8\u0ccd NALLI SILK SAREE",
    "bannerSubtitle": "ESTABLISHED 1928 \u2022 PURE HERITAGE SILKS",
    "brandColor": "#991b1b",
    "type": "landmark",
    "facadeStyle": "retail_banner",
    "cx": 48.9,
    "cz": 347.8,
    "height": 28.0,
    "levels": 4,
    "pts": [
      [
        -4.77,
        5.6
      ],
      [
        8.69,
        3.94
      ],
      [
        7.16,
        -8.41
      ],
      [
        -6.3,
        -6.75
      ]
    ]
  },
  {
    "id": "lm_jos_alukas",
    "name": "Jos Alukas Jewellery",
    "bannerTitle": "\u0c9c\u0ccb\u0cb8\u0ccd \u0c86\u0cb2\u0cc1\u0c95\u0ccd\u0c95\u0cbe\u0cb8\u0ccd JOS ALUKAS",
    "bannerSubtitle": "GOLD & DIAMONDS \u2022 BIS 916",
    "brandColor": "#831843",
    "type": "retail",
    "facadeStyle": "retail_banner",
    "cx": 66.7,
    "cz": -21.0,
    "height": 24.0,
    "levels": 4,
    "pts": [
      [
        -4.37,
        4.96
      ],
      [
        6.28,
        5.2
      ],
      [
        6.56,
        -7.43
      ],
      [
        -4.09,
        -7.67
      ]
    ]
  },
  {
    "id": "lm_kalamandir",
    "name": "Kalamandir Wedding Silks",
    "bannerTitle": "\u0c95\u0cb2\u0cbe\u0cae\u0c82\u0ca6\u0cbf\u0cb0 KALAMANDIR",
    "bannerSubtitle": "WEDDING SILKS & KANCHEEPURAM SAREES",
    "brandColor": "#881337",
    "type": "landmark",
    "facadeStyle": "retail_banner",
    "cx": 46.0,
    "cz": 332.0,
    "height": 32.0,
    "levels": 5,
    "pts": [
      [
        -5.36,
        7.04
      ],
      [
        10.24,
        4.83
      ],
      [
        8.05,
        -10.55
      ],
      [
        -7.55,
        -8.34
      ]
    ]
  },
  {
    "id": "lm_krisna_senate",
    "name": "Krisna Senate",
    "bannerTitle": "KRISNA SENATE",
    "bannerSubtitle": "CORPORATE OFFICES & RETAIL",
    "brandColor": "#1e293b",
    "type": "techpark",
    "facadeStyle": "glass_curtain",
    "cx": -40.4,
    "cz": 80.0,
    "height": 30.0,
    "levels": 6,
    "pts": [
      [
        -11.69,
        -6.72
      ],
      [
        15.67,
        -9.08
      ],
      [
        17.41,
        10.07
      ],
      [
        -9.7,
        12.43
      ]
    ]
  },
  {
    "id": "lm_khazana",
    "name": "Khazana Jewellery",
    "bannerTitle": "KHAZANA JEWELLERY",
    "bannerSubtitle": "BRIDAL COLLECTIONS & PRECIOUS GEMS",
    "brandColor": "#701a75",
    "type": "retail",
    "facadeStyle": "retail_banner",
    "cx": -253.6,
    "cz": -15.5,
    "height": 24.0,
    "levels": 4,
    "pts": [
      [
        -2.8,
        11.38
      ],
      [
        6.86,
        10.44
      ],
      [
        4.2,
        -17.07
      ],
      [
        -5.46,
        -16.14
      ]
    ]
  },
  {
    "id": "lm_ittina_akya",
    "name": "Ittina Akya Apartments",
    "bannerTitle": "ITTINA AKYA",
    "bannerSubtitle": "RESIDENTIAL TOWERS",
    "brandColor": "#475569",
    "type": "apartments",
    "facadeStyle": "residential_balcony",
    "cx": -134.7,
    "cz": -304.5,
    "height": 34.0,
    "levels": 9,
    "pts": [
      [
        -11.49,
        7.76
      ],
      [
        18.76,
        4.99
      ],
      [
        17.25,
        -11.65
      ],
      [
        -13.01,
        -8.87
      ]
    ]
  },
  {
    "id": "lm_krishna_summit",
    "name": "Krishna Summit IT Park",
    "bannerTitle": "KRISHNA SUMMIT",
    "bannerSubtitle": "COMMERCIAL IT TOWER & TECH SUITES",
    "brandColor": "#0f172a",
    "type": "techpark",
    "facadeStyle": "glass_curtain",
    "cx": -37.4,
    "cz": 109.2,
    "height": 38.0,
    "levels": 8,
    "pts": [
      [
        -10.65,
        9.97
      ],
      [
        18.01,
        7.33
      ],
      [
        15.98,
        -14.95
      ],
      [
        -12.69,
        -12.32
      ]
    ]
  },
  {
    "id": "lm_krishna_grand",
    "name": "Krishna Grand",
    "bannerTitle": "KRISHNA GRAND",
    "bannerSubtitle": "FINE DINING & RESIDENCY",
    "brandColor": "#14532d",
    "type": "commercial",
    "facadeStyle": "commercial_grid",
    "cx": -34.7,
    "cz": 136.6,
    "height": 26.0,
    "levels": 5,
    "pts": [
      [
        -9.67,
        9.09
      ],
      [
        15.88,
        7.42
      ],
      [
        14.5,
        -13.64
      ],
      [
        -11.06,
        -11.97
      ]
    ]
  },
  {
    "id": "lm_krishna_vaibhava",
    "name": "Krishna Vaibhava",
    "bannerTitle": "KRISHNA VAIBHAVA",
    "bannerSubtitle": "COMMERCIAL COMPLEX",
    "brandColor": "#1e293b",
    "type": "commercial",
    "facadeStyle": "commercial_grid",
    "cx": -32.6,
    "cz": 59.0,
    "height": 28.0,
    "levels": 5,
    "pts": [
      [
        -5.08,
        9.79
      ],
      [
        9.55,
        8.16
      ],
      [
        7.94,
        -14.42
      ],
      [
        -7.35,
        -13.34
      ]
    ]
  },
  {
    "id": "lm_krishna_shine",
    "name": "Krishna Shine",
    "bannerTitle": "KRISHNA SHINE",
    "bannerSubtitle": "BUSINESS CENTER",
    "brandColor": "#1e293b",
    "type": "commercial",
    "facadeStyle": "commercial_grid",
    "cx": -48.9,
    "cz": 60.6,
    "height": 26.0,
    "levels": 5,
    "pts": [
      [
        -5.97,
        9.92
      ],
      [
        11.22,
        8.24
      ],
      [
        8.95,
        -14.89
      ],
      [
        -8.23,
        -13.2
      ]
    ]
  },
  {
    "id": "lm_sigma_arcade",
    "name": "Sigma Arcade",
    "bannerTitle": "SIGMA ARCADE",
    "bannerSubtitle": "RETAIL & ELECTRONICS PLAZA",
    "brandColor": "#334155",
    "type": "commercial",
    "facadeStyle": "commercial_grid",
    "cx": -302.3,
    "cz": -15.0,
    "height": 22.0,
    "levels": 4,
    "pts": [
      [
        -11.45,
        -10.64
      ],
      [
        10.65,
        -12.86
      ],
      [
        13.09,
        11.23
      ],
      [
        4.82,
        12.07
      ],
      [
        4.08,
        4.71
      ],
      [
        -9.77,
        6.1
      ]
    ]
  },
  {
    "id": "lm_nandini",
    "name": "Nandini Milk Parlour",
    "bannerTitle": "\u0ca8\u0c82\u0ca6\u0cbf\u0ca8\u0cbf NANDINI (KMF)",
    "bannerSubtitle": "PURE MILK & DAIRY DELIGHTS",
    "brandColor": "#1d4ed8",
    "type": "retail",
    "facadeStyle": "commercial_grid",
    "cx": 202.4,
    "cz": -29.0,
    "height": 16.0,
    "levels": 2,
    "pts": [
      [
        -4.86,
        3.04
      ],
      [
        -3.93,
        -5.74
      ],
      [
        7.3,
        -4.55
      ],
      [
        6.37,
        4.23
      ]
    ]
  }
];

export const SURROUNDING_OSM_BUILDINGS: SurroundingBuilding[] = [
  {
    "id": "osm_346555792",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 23.3,
    "cz": -19.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        0.11,
        2.39
      ],
      [
        2.77,
        0.44
      ],
      [
        -0.15,
        -3.59
      ],
      [
        -2.83,
        -1.65
      ]
    ]
  },
  {
    "id": "osm_346555722",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 31.2,
    "cz": -17.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.72,
        2.37
      ],
      [
        2.85,
        2.14
      ],
      [
        2.57,
        -3.56
      ],
      [
        -2.0,
        -3.32
      ]
    ]
  },
  {
    "id": "osm_346555784",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 38.8,
    "cz": -16.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.6,
        3.93
      ],
      [
        3.91,
        3.93
      ],
      [
        3.91,
        -5.89
      ],
      [
        -2.6,
        -5.89
      ]
    ]
  },
  {
    "id": "osm_346555716",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 34.8,
    "cz": -32.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.31,
        3.33
      ],
      [
        7.82,
        3.56
      ],
      [
        7.98,
        -4.99
      ],
      [
        -5.16,
        -5.22
      ]
    ]
  },
  {
    "id": "osm_343430007",
    "type": "retail",
    "facadeStyle": "retail_banner",
    "color": "#475569",
    "cx": -45.8,
    "cz": -19.9,
    "height": 18.0,
    "levels": 4,
    "pts": [
      [
        -6.65,
        18.73
      ],
      [
        3.59,
        16.84
      ],
      [
        6.02,
        15.36
      ],
      [
        7.85,
        13.09
      ],
      [
        8.3,
        9.59
      ],
      [
        6.02,
        -2.52
      ],
      [
        3.46,
        -3.82
      ],
      [
        -4.04,
        -44.3
      ],
      [
        -17.86,
        -41.73
      ]
    ]
  },
  {
    "id": "osm_346534887",
    "type": "commercial",
    "facadeStyle": "glass_curtain",
    "color": "#1e293b",
    "cx": -42.9,
    "cz": 37.0,
    "height": 28.0,
    "levels": 7,
    "pts": [
      [
        -10.48,
        6.3
      ],
      [
        16.92,
        3.81
      ],
      [
        15.72,
        -9.44
      ],
      [
        -11.68,
        -6.96
      ]
    ]
  },
  {
    "id": "osm_1070105456",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 24.1,
    "cz": -54.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.97,
        10.28
      ],
      [
        15.3,
        6.77
      ],
      [
        11.95,
        -15.42
      ],
      [
        -11.33,
        -11.91
      ]
    ]
  },
  {
    "id": "osm_346555705",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 48.0,
    "cz": -37.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.41,
        5.11
      ],
      [
        5.28,
        5.0
      ],
      [
        5.1,
        -7.68
      ],
      [
        -3.57,
        -7.56
      ]
    ]
  },
  {
    "id": "osm_223045618",
    "type": "commercial",
    "facadeStyle": "glass_curtain",
    "color": "#1e293b",
    "cx": 52.6,
    "cz": 38.2,
    "height": 28.0,
    "levels": 7,
    "pts": [
      [
        -5.04,
        6.45
      ],
      [
        7.98,
        6.11
      ],
      [
        7.56,
        -9.67
      ],
      [
        -5.45,
        -9.33
      ]
    ]
  },
  {
    "id": "osm_346555826",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 48.8,
    "cz": -55.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.33,
        5.84
      ],
      [
        6.03,
        6.17
      ],
      [
        6.49,
        -8.75
      ],
      [
        -3.86,
        -9.08
      ]
    ]
  },
  {
    "id": "osm_346545690",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 51.2,
    "cz": 54.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.47,
        5.68
      ],
      [
        5.73,
        5.32
      ],
      [
        5.2,
        -8.53
      ],
      [
        -4.0,
        -8.17
      ]
    ]
  },
  {
    "id": "osm_346545922",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 65.8,
    "cz": 37.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.97,
        5.58
      ],
      [
        6.3,
        5.32
      ],
      [
        5.95,
        -8.38
      ],
      [
        -4.32,
        -8.11
      ]
    ]
  },
  {
    "id": "osm_374976332",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 78.2,
    "cz": -18.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.69,
        -4.0
      ],
      [
        6.75,
        -4.31
      ],
      [
        7.02,
        6.0
      ],
      [
        -4.41,
        6.3
      ]
    ]
  },
  {
    "id": "osm_346534783",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -71.9,
    "cz": 42.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.63,
        8.85
      ],
      [
        11.81,
        7.17
      ],
      [
        9.95,
        -13.28
      ],
      [
        -8.5,
        -11.6
      ]
    ]
  },
  {
    "id": "osm_346555793",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 79.5,
    "cz": -26.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.48,
        1.95
      ],
      [
        4.86,
        2.52
      ],
      [
        5.23,
        -2.94
      ],
      [
        -3.11,
        -3.5
      ]
    ]
  },
  {
    "id": "osm_346545746",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 75.5,
    "cz": 38.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.0,
        4.79
      ],
      [
        3.39,
        4.61
      ],
      [
        3.01,
        -7.19
      ],
      [
        -2.39,
        -7.01
      ]
    ]
  },
  {
    "id": "osm_346545681",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 65.5,
    "cz": 54.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.46,
        5.74
      ],
      [
        7.22,
        5.3
      ],
      [
        6.7,
        -8.62
      ],
      [
        -4.99,
        -8.18
      ]
    ]
  },
  {
    "id": "osm_346555742",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 49.7,
    "cz": -71.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.93,
        6.25
      ],
      [
        7.01,
        6.54
      ],
      [
        7.39,
        -9.38
      ],
      [
        -4.56,
        -9.66
      ]
    ]
  },
  {
    "id": "osm_346535409",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -66.7,
    "cz": 59.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        7.62,
        3.92
      ],
      [
        6.0,
        -8.23
      ],
      [
        -11.44,
        -5.88
      ],
      [
        -9.81,
        6.25
      ]
    ]
  },
  {
    "id": "osm_346545733",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 81.5,
    "cz": 38.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.56,
        4.48
      ],
      [
        2.79,
        4.3
      ],
      [
        2.33,
        -6.73
      ],
      [
        -2.0,
        -6.55
      ]
    ]
  },
  {
    "id": "osm_343430009",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -82.5,
    "cz": -40.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.78,
        6.54
      ],
      [
        9.19,
        4.57
      ],
      [
        7.17,
        -9.82
      ],
      [
        -6.8,
        -7.84
      ]
    ]
  },
  {
    "id": "osm_346555745",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 80.5,
    "cz": -44.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.07,
        2.5
      ],
      [
        5.29,
        3.53
      ],
      [
        6.1,
        -3.75
      ],
      [
        -3.27,
        -4.77
      ]
    ]
  },
  {
    "id": "osm_346555787",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 69.6,
    "cz": -61.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.31,
        4.72
      ],
      [
        6.07,
        5.06
      ],
      [
        6.46,
        -7.08
      ],
      [
        -3.92,
        -7.41
      ]
    ]
  },
  {
    "id": "osm_346545952",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 52.4,
    "cz": 78.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.18,
        5.06
      ],
      [
        6.27,
        5.06
      ],
      [
        6.27,
        -7.59
      ],
      [
        -4.18,
        -7.59
      ]
    ]
  },
  {
    "id": "osm_346545848",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 77.3,
    "cz": 55.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.52,
        3.17
      ],
      [
        5.59,
        2.82
      ],
      [
        5.29,
        -4.75
      ],
      [
        -3.83,
        -4.39
      ]
    ]
  },
  {
    "id": "osm_346545903",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 89.1,
    "cz": 35.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.53,
        6.27
      ],
      [
        5.59,
        6.1
      ],
      [
        5.29,
        -9.41
      ],
      [
        -3.83,
        -9.23
      ]
    ]
  },
  {
    "id": "osm_346535378",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -67.4,
    "cz": 71.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.8,
        2.66
      ],
      [
        9.34,
        0.54
      ],
      [
        8.7,
        -4.0
      ],
      [
        -6.44,
        -1.87
      ]
    ]
  },
  {
    "id": "osm_346545751",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 52.2,
    "cz": 87.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.25,
        1.88
      ],
      [
        6.38,
        1.88
      ],
      [
        6.38,
        -2.81
      ],
      [
        -4.25,
        -2.81
      ]
    ]
  },
  {
    "id": "osm_346545678",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 66.4,
    "cz": 77.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.38,
        6.03
      ],
      [
        6.57,
        6.03
      ],
      [
        6.57,
        -9.05
      ],
      [
        -4.38,
        -9.05
      ]
    ]
  },
  {
    "id": "osm_346555715",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 99.0,
    "cz": -25.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.2,
        4.92
      ],
      [
        5.39,
        5.61
      ],
      [
        6.31,
        -7.38
      ],
      [
        -3.28,
        -8.07
      ]
    ]
  },
  {
    "id": "osm_346545917",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 86.6,
    "cz": 54.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.04,
        2.45
      ],
      [
        3.27,
        2.28
      ],
      [
        3.07,
        -3.69
      ],
      [
        -2.24,
        -3.51
      ]
    ]
  },
  {
    "id": "osm_346545713",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 101.3,
    "cz": 29.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.77,
        2.76
      ],
      [
        5.6,
        2.85
      ],
      [
        5.67,
        -4.13
      ],
      [
        -3.71,
        -4.22
      ]
    ]
  },
  {
    "id": "osm_346555830",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 85.2,
    "cz": -62.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.98,
        4.1
      ],
      [
        2.23,
        4.45
      ],
      [
        2.46,
        -0.57
      ],
      [
        4.75,
        -0.46
      ],
      [
        5.0,
        -5.58
      ],
      [
        -4.49,
        -6.04
      ]
    ]
  },
  {
    "id": "osm_343430012",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -103.9,
    "cz": -20.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.56,
        8.15
      ],
      [
        6.53,
        6.87
      ],
      [
        3.85,
        -12.22
      ],
      [
        -5.25,
        -10.95
      ]
    ]
  },
  {
    "id": "osm_346555707",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 100.0,
    "cz": -35.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.78,
        1.46
      ],
      [
        5.47,
        1.91
      ],
      [
        5.67,
        -2.18
      ],
      [
        -3.58,
        -2.63
      ]
    ]
  },
  {
    "id": "osm_346555795",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 71.2,
    "cz": -79.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.94,
        6.35
      ],
      [
        6.35,
        7.07
      ],
      [
        7.43,
        -9.51
      ],
      [
        -3.88,
        -10.25
      ]
    ]
  },
  {
    "id": "osm_346545980",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 100.6,
    "cz": 38.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.5,
        2.2
      ],
      [
        5.26,
        2.2
      ],
      [
        5.26,
        -3.29
      ],
      [
        -3.5,
        -3.29
      ]
    ]
  },
  {
    "id": "osm_346534916",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -66.9,
    "cz": 84.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.86,
        6.42
      ],
      [
        9.29,
        5.92
      ],
      [
        8.78,
        -9.62
      ],
      [
        -6.37,
        -9.12
      ]
    ]
  },
  {
    "id": "osm_346555824",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 54.1,
    "cz": -93.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        5.78,
        9.57
      ],
      [
        6.06,
        -14.17
      ],
      [
        -8.67,
        -14.35
      ],
      [
        -8.94,
        9.4
      ]
    ]
  },
  {
    "id": "osm_346545935",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 51.4,
    "cz": 97.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.32,
        3.2
      ],
      [
        5.93,
        3.84
      ],
      [
        6.48,
        -4.79
      ],
      [
        -3.78,
        -5.44
      ]
    ]
  },
  {
    "id": "osm_346545768",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 78.2,
    "cz": 77.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.85,
        6.03
      ],
      [
        5.77,
        6.03
      ],
      [
        5.77,
        -9.05
      ],
      [
        -3.85,
        -9.05
      ]
    ]
  },
  {
    "id": "osm_346555726",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 85.5,
    "cz": -72.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.05,
        1.92
      ],
      [
        5.88,
        2.25
      ],
      [
        6.07,
        -2.87
      ],
      [
        -3.87,
        -3.22
      ]
    ]
  },
  {
    "id": "osm_1217664071",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -94.9,
    "cz": 59.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.24,
        15.58
      ],
      [
        13.22,
        13.54
      ],
      [
        9.37,
        -23.36
      ],
      [
        -10.1,
        -21.33
      ]
    ]
  },
  {
    "id": "osm_346545666",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 100.8,
    "cz": 50.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.45,
        5.62
      ],
      [
        5.45,
        5.44
      ],
      [
        5.18,
        -8.43
      ],
      [
        -3.73,
        -8.26
      ]
    ]
  },
  {
    "id": "osm_346555761",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 100.4,
    "cz": -52.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.94,
        9.68
      ],
      [
        5.94,
        11.05
      ],
      [
        8.9,
        -14.52
      ],
      [
        -2.98,
        -15.9
      ]
    ]
  },
  {
    "id": "osm_343430013",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -107.1,
    "cz": -37.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.39,
        3.55
      ],
      [
        5.24,
        1.79
      ],
      [
        3.58,
        -5.34
      ],
      [
        -4.03,
        -3.57
      ]
    ]
  },
  {
    "id": "osm_1086238613",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 65.1,
    "cz": 93.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.22,
        6.23
      ],
      [
        6.88,
        5.82
      ],
      [
        6.33,
        -9.34
      ],
      [
        -4.77,
        -8.93
      ]
    ]
  },
  {
    "id": "osm_346534993",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -59.8,
    "cz": 99.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        3.76,
        4.27
      ],
      [
        3.51,
        -6.61
      ],
      [
        -5.65,
        -6.4
      ],
      [
        -5.4,
        4.48
      ]
    ]
  },
  {
    "id": "osm_346555785",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 85.5,
    "cz": -78.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.93,
        2.0
      ],
      [
        7.06,
        2.69
      ],
      [
        7.38,
        -3.0
      ],
      [
        -4.6,
        -3.69
      ]
    ]
  },
  {
    "id": "osm_346545645",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 89.5,
    "cz": 75.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.8,
        5.36
      ],
      [
        5.91,
        5.2
      ],
      [
        5.7,
        -8.05
      ],
      [
        -4.02,
        -7.89
      ]
    ]
  },
  {
    "id": "osm_343430014",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -108.1,
    "cz": -47.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.95,
        3.34
      ],
      [
        5.65,
        1.81
      ],
      [
        4.43,
        -5.01
      ],
      [
        -4.17,
        -3.47
      ]
    ]
  },
  {
    "id": "osm_346545815",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 113.1,
    "cz": 35.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.43,
        6.18
      ],
      [
        6.84,
        6.05
      ],
      [
        6.65,
        -9.26
      ],
      [
        -4.63,
        -9.13
      ]
    ]
  },
  {
    "id": "osm_346545821",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 76.4,
    "cz": 94.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.51,
        4.22
      ],
      [
        5.27,
        4.22
      ],
      [
        5.27,
        -6.32
      ],
      [
        -3.51,
        -6.32
      ]
    ]
  },
  {
    "id": "osm_346555738",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 86.3,
    "cz": -85.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.97,
        1.22
      ],
      [
        5.63,
        2.02
      ],
      [
        5.95,
        -1.84
      ],
      [
        -3.64,
        -2.64
      ]
    ]
  },
  {
    "id": "osm_346545816",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 113.1,
    "cz": 50.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.96,
        4.26
      ],
      [
        6.24,
        3.96
      ],
      [
        5.94,
        -6.38
      ],
      [
        -4.26,
        -6.08
      ]
    ]
  },
  {
    "id": "osm_346534935",
    "type": "commercial",
    "facadeStyle": "glass_curtain",
    "color": "#1e293b",
    "cx": -116.4,
    "cz": 44.2,
    "height": 28.0,
    "levels": 7,
    "pts": [
      [
        -4.82,
        7.77
      ],
      [
        9.97,
        5.48
      ],
      [
        7.19,
        -11.76
      ],
      [
        -7.5,
        -9.24
      ]
    ]
  },
  {
    "id": "osm_346555741",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 72.5,
    "cz": -101.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.92,
        3.41
      ],
      [
        6.87,
        4.07
      ],
      [
        7.38,
        -5.12
      ],
      [
        -4.41,
        -5.78
      ]
    ]
  },
  {
    "id": "osm_346535679",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -92.7,
    "cz": 84.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.0,
        6.04
      ],
      [
        2.27,
        5.1
      ],
      [
        1.72,
        -0.28
      ],
      [
        9.55,
        -1.08
      ],
      [
        8.77,
        -8.79
      ],
      [
        -8.33,
        -7.06
      ]
    ]
  },
  {
    "id": "osm_346534835",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -111.0,
    "cz": 58.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.04,
        3.12
      ],
      [
        3.85,
        2.48
      ],
      [
        3.05,
        -4.69
      ],
      [
        -2.83,
        -4.04
      ]
    ]
  },
  {
    "id": "osm_346545852",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 103.7,
    "cz": 72.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.78,
        4.14
      ],
      [
        4.16,
        4.14
      ],
      [
        4.16,
        -6.22
      ],
      [
        -2.78,
        -6.22
      ]
    ]
  },
  {
    "id": "osm_346545964",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 50.9,
    "cz": 116.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.92,
        6.65
      ],
      [
        7.23,
        6.76
      ],
      [
        7.38,
        -9.98
      ],
      [
        -4.77,
        -10.09
      ]
    ]
  },
  {
    "id": "osm_346555801",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 86.6,
    "cz": -93.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.97,
        3.75
      ],
      [
        5.05,
        4.55
      ],
      [
        5.95,
        -5.64
      ],
      [
        -3.07,
        -6.43
      ]
    ]
  },
  {
    "id": "osm_346545996",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 88.9,
    "cz": 91.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.46,
        5.19
      ],
      [
        7.04,
        4.86
      ],
      [
        6.69,
        -7.79
      ],
      [
        -4.83,
        -7.47
      ]
    ]
  },
  {
    "id": "osm_346535246",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -60.9,
    "cz": 113.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.4,
        5.0
      ],
      [
        5.61,
        4.62
      ],
      [
        5.1,
        -7.48
      ],
      [
        -3.91,
        -7.12
      ]
    ]
  },
  {
    "id": "osm_346545914",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 125.9,
    "cz": 31.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.7,
        5.98
      ],
      [
        5.68,
        5.89
      ],
      [
        5.54,
        -8.97
      ],
      [
        -3.84,
        -8.89
      ]
    ]
  },
  {
    "id": "osm_1064020739",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -81.5,
    "cz": -102.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        15.47,
        2.35
      ],
      [
        -3.27,
        8.27
      ],
      [
        -8.21,
        -7.41
      ],
      [
        10.18,
        -13.22
      ],
      [
        6.73,
        -24.12
      ],
      [
        -34.1,
        -11.21
      ],
      [
        -21.7,
        28.01
      ],
      [
        19.47,
        14.99
      ]
    ]
  },
  {
    "id": "osm_346555733",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 129.8,
    "cz": -19.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.02,
        3.29
      ],
      [
        4.39,
        2.69
      ],
      [
        4.54,
        -4.78
      ],
      [
        -2.87,
        -4.48
      ]
    ]
  },
  {
    "id": "osm_346545992",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 111.8,
    "cz": 69.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.81,
        2.05
      ],
      [
        4.21,
        2.05
      ],
      [
        4.21,
        -3.07
      ],
      [
        -2.81,
        -3.07
      ]
    ]
  },
  {
    "id": "osm_346535448",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -117.5,
    "cz": 59.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.79,
        3.14
      ],
      [
        3.44,
        2.6
      ],
      [
        2.69,
        -4.71
      ],
      [
        -2.53,
        -4.19
      ]
    ]
  },
  {
    "id": "osm_1070105463",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -87.4,
    "cz": 99.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        8.35,
        3.05
      ],
      [
        6.47,
        -7.85
      ],
      [
        -12.52,
        -4.56
      ],
      [
        -10.63,
        6.33
      ]
    ]
  },
  {
    "id": "osm_346545990",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 124.6,
    "cz": 48.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.48,
        4.85
      ],
      [
        5.46,
        4.67
      ],
      [
        5.22,
        -7.28
      ],
      [
        -3.71,
        -7.1
      ]
    ]
  },
  {
    "id": "osm_346555831",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 115.9,
    "cz": -66.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.55,
        -3.22
      ],
      [
        -4.07,
        0.61
      ],
      [
        0.39,
        1.21
      ],
      [
        0.15,
        2.98
      ],
      [
        4.95,
        3.64
      ],
      [
        5.7,
        -1.97
      ]
    ]
  },
  {
    "id": "osm_1086241107",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 51.1,
    "cz": -125.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.6,
        5.22
      ],
      [
        -6.66,
        -7.74
      ],
      [
        9.91,
        -7.82
      ],
      [
        9.97,
        5.14
      ]
    ]
  },
  {
    "id": "osm_346555708",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 84.8,
    "cz": -105.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.01,
        2.02
      ],
      [
        2.9,
        2.13
      ],
      [
        3.02,
        -3.02
      ],
      [
        -1.89,
        -3.14
      ]
    ]
  },
  {
    "id": "osm_346555776",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 72.9,
    "cz": -114.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.66,
        5.78
      ],
      [
        7.88,
        6.34
      ],
      [
        8.5,
        -8.68
      ],
      [
        -5.04,
        -9.24
      ]
    ]
  },
  {
    "id": "osm_346546008",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 69.3,
    "cz": 116.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.49,
        6.97
      ],
      [
        3.01,
        7.06
      ],
      [
        3.07,
        0.02
      ],
      [
        8.08,
        0.07
      ],
      [
        8.18,
        -10.46
      ],
      [
        -7.33,
        -10.61
      ]
    ]
  },
  {
    "id": "osm_346534821",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -127.6,
    "cz": 47.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.58,
        7.29
      ],
      [
        4.73,
        6.44
      ],
      [
        2.36,
        -10.93
      ],
      [
        -3.94,
        -10.08
      ]
    ]
  },
  {
    "id": "osm_346545669",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 101.5,
    "cz": 91.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.13,
        5.59
      ],
      [
        6.3,
        5.51
      ],
      [
        6.19,
        -8.38
      ],
      [
        -4.24,
        -8.3
      ]
    ]
  },
  {
    "id": "osm_346534964",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -114.9,
    "cz": 75.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.07,
        4.02
      ],
      [
        10.17,
        1.79
      ],
      [
        9.1,
        -6.02
      ],
      [
        -7.15,
        -3.8
      ]
    ]
  },
  {
    "id": "osm_346535455",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -63.9,
    "cz": 122.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.91,
        2.21
      ],
      [
        7.61,
        1.58
      ],
      [
        7.36,
        -3.3
      ],
      [
        -5.16,
        -2.68
      ]
    ]
  },
  {
    "id": "osm_346535002",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -126.5,
    "cz": 60.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.01,
        3.43
      ],
      [
        2.81,
        2.8
      ],
      [
        1.52,
        -5.13
      ],
      [
        -2.29,
        -4.51
      ]
    ]
  },
  {
    "id": "osm_1070105464",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -85.7,
    "cz": 111.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        8.35,
        3.05
      ],
      [
        6.46,
        -7.85
      ],
      [
        -12.53,
        -4.58
      ],
      [
        -10.65,
        6.33
      ]
    ]
  },
  {
    "id": "osm_346535670",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -113.2,
    "cz": 83.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.65,
        -2.57
      ],
      [
        -6.27,
        6.81
      ],
      [
        7.62,
        4.78
      ],
      [
        6.73,
        -1.35
      ],
      [
        3.84,
        -0.93
      ],
      [
        3.36,
        -4.18
      ]
    ]
  },
  {
    "id": "osm_346555791",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 139.8,
    "cz": -19.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.88,
        2.24
      ],
      [
        4.31,
        2.24
      ],
      [
        4.31,
        -3.36
      ],
      [
        -2.88,
        -3.36
      ]
    ]
  },
  {
    "id": "osm_346546004",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 138.6,
    "cz": 31.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.67,
        6.64
      ],
      [
        2.86,
        6.46
      ],
      [
        2.67,
        -1.86
      ],
      [
        4.5,
        -1.91
      ],
      [
        4.34,
        -8.1
      ],
      [
        -5.0,
        -7.87
      ]
    ]
  },
  {
    "id": "osm_346555774",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 132.6,
    "cz": -53.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.44,
        1.99
      ],
      [
        5.27,
        3.93
      ],
      [
        6.65,
        -2.97
      ],
      [
        -3.06,
        -4.92
      ]
    ]
  },
  {
    "id": "osm_346545795",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 53.7,
    "cz": 133.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.58,
        6.16
      ],
      [
        6.74,
        6.25
      ],
      [
        6.88,
        -9.23
      ],
      [
        -4.44,
        -9.32
      ]
    ]
  },
  {
    "id": "osm_346555735",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 141.2,
    "cz": -29.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.86,
        2.55
      ],
      [
        4.37,
        4.04
      ],
      [
        5.79,
        -3.84
      ],
      [
        -2.44,
        -5.32
      ]
    ]
  },
  {
    "id": "osm_346546007",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 125.7,
    "cz": 72.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.22,
        5.66
      ],
      [
        7.85,
        5.66
      ],
      [
        7.85,
        -8.48
      ],
      [
        -5.26,
        -8.48
      ]
    ]
  },
  {
    "id": "osm_352222729",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 112.7,
    "cz": 91.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.32,
        3.54
      ],
      [
        6.67,
        3.31
      ],
      [
        6.49,
        -5.31
      ],
      [
        -4.5,
        -5.08
      ]
    ]
  },
  {
    "id": "osm_346545800",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 137.1,
    "cz": 49.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.47,
        4.06
      ],
      [
        6.86,
        3.9
      ],
      [
        6.69,
        -6.1
      ],
      [
        -4.63,
        -5.93
      ]
    ]
  },
  {
    "id": "osm_346545774",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 89.8,
    "cz": 115.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.02,
        6.3
      ],
      [
        6.3,
        6.13
      ],
      [
        6.03,
        -9.45
      ],
      [
        -4.29,
        -9.27
      ]
    ]
  },
  {
    "id": "osm_1086240619",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 64.4,
    "cz": 133.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.55,
        5.49
      ],
      [
        4.01,
        5.41
      ],
      [
        3.83,
        -8.23
      ],
      [
        -2.72,
        -8.14
      ]
    ]
  },
  {
    "id": "osm_346555818",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 107.4,
    "cz": -101.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.86,
        3.29
      ],
      [
        4.83,
        4.2
      ],
      [
        5.78,
        -4.93
      ],
      [
        -2.9,
        -5.84
      ]
    ]
  },
  {
    "id": "osm_346555714",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 143.1,
    "cz": -38.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.66,
        1.61
      ],
      [
        4.11,
        3.43
      ],
      [
        5.49,
        -2.42
      ],
      [
        -2.28,
        -4.25
      ]
    ]
  },
  {
    "id": "osm_346535137",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -142.1,
    "cz": 43.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.04,
        5.82
      ],
      [
        4.07,
        5.39
      ],
      [
        3.05,
        -8.74
      ],
      [
        -3.06,
        -8.29
      ]
    ]
  },
  {
    "id": "osm_346534827",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -66.2,
    "cz": 133.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.47,
        4.31
      ],
      [
        8.17,
        2.19
      ],
      [
        6.71,
        -6.48
      ],
      [
        -5.93,
        -4.35
      ]
    ]
  },
  {
    "id": "osm_346555813",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 89.9,
    "cz": -119.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.94,
        2.96
      ],
      [
        5.31,
        3.65
      ],
      [
        5.91,
        -4.43
      ],
      [
        -3.34,
        -5.12
      ]
    ]
  },
  {
    "id": "osm_346534797",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -140.2,
    "cz": 53.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.75,
        2.23
      ],
      [
        4.68,
        1.34
      ],
      [
        4.13,
        -3.34
      ],
      [
        -3.31,
        -2.46
      ]
    ]
  },
  {
    "id": "osm_346555834",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 57.8,
    "cz": -139.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.32,
        3.74
      ],
      [
        6.15,
        4.09
      ],
      [
        6.48,
        -5.62
      ],
      [
        -4.0,
        -5.96
      ]
    ]
  },
  {
    "id": "osm_346545956",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 147.4,
    "cz": 30.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.32,
        5.7
      ],
      [
        5.53,
        5.35
      ],
      [
        4.98,
        -8.55
      ],
      [
        -3.88,
        -8.2
      ]
    ]
  },
  {
    "id": "osm_1087942881",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -85.3,
    "cz": 124.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        8.35,
        3.05
      ],
      [
        6.46,
        -7.85
      ],
      [
        -12.53,
        -4.57
      ],
      [
        -10.65,
        6.33
      ]
    ]
  },
  {
    "id": "osm_346535179",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -137.6,
    "cz": 62.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.31,
        3.75
      ],
      [
        4.44,
        2.99
      ],
      [
        3.47,
        -5.62
      ],
      [
        -3.28,
        -4.86
      ]
    ]
  },
  {
    "id": "osm_1073336188",
    "type": "commercial",
    "facadeStyle": "glass_curtain",
    "color": "#1e293b",
    "cx": -145.3,
    "cz": -45.2,
    "height": 28.0,
    "levels": 7,
    "pts": [
      [
        -9.09,
        37.85
      ],
      [
        31.92,
        29.12
      ],
      [
        13.64,
        -56.79
      ],
      [
        -27.4,
        -48.04
      ]
    ]
  },
  {
    "id": "osm_346555748",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 115.6,
    "cz": -100.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.88,
        2.76
      ],
      [
        2.22,
        3.11
      ],
      [
        2.83,
        -4.14
      ],
      [
        -1.28,
        -4.47
      ]
    ]
  },
  {
    "id": "osm_346555781",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 145.8,
    "cz": -46.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.04,
        2.15
      ],
      [
        4.52,
        3.98
      ],
      [
        6.06,
        -3.23
      ],
      [
        -2.51,
        -5.06
      ]
    ]
  },
  {
    "id": "osm_346545944",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 101.7,
    "cz": 114.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.03,
        5.74
      ],
      [
        6.05,
        5.74
      ],
      [
        6.05,
        -8.6
      ],
      [
        -4.03,
        -8.6
      ]
    ]
  },
  {
    "id": "osm_346535652",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -112.9,
    "cz": 103.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.51,
        4.44
      ],
      [
        7.96,
        2.3
      ],
      [
        6.64,
        -5.49
      ],
      [
        -0.42,
        -4.29
      ],
      [
        0.11,
        -1.16
      ],
      [
        -5.3,
        -0.24
      ]
    ]
  },
  {
    "id": "osm_346545953",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 147.7,
    "cz": 41.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.23,
        1.7
      ],
      [
        4.9,
        1.61
      ],
      [
        4.86,
        -2.55
      ],
      [
        -3.29,
        -2.46
      ]
    ]
  },
  {
    "id": "osm_346545786",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 125.6,
    "cz": 88.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.92,
        5.78
      ],
      [
        6.09,
        5.62
      ],
      [
        5.87,
        -8.67
      ],
      [
        -4.14,
        -8.51
      ]
    ]
  },
  {
    "id": "osm_346545703",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 78.5,
    "cz": 132.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -8.7,
        5.62
      ],
      [
        13.77,
        4.37
      ],
      [
        13.05,
        -8.42
      ],
      [
        -9.41,
        -7.17
      ]
    ]
  },
  {
    "id": "osm_346555810",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 74.0,
    "cz": -135.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.43,
        3.26
      ],
      [
        6.08,
        3.95
      ],
      [
        6.65,
        -4.9
      ],
      [
        -3.85,
        -5.58
      ]
    ]
  },
  {
    "id": "osm_346555827",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 90.1,
    "cz": -127.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.03,
        1.2
      ],
      [
        5.79,
        1.88
      ],
      [
        6.05,
        -1.79
      ],
      [
        -3.77,
        -2.47
      ]
    ]
  },
  {
    "id": "osm_346555703",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 146.5,
    "cz": -54.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.02,
        0.73
      ],
      [
        3.6,
        2.44
      ],
      [
        4.53,
        -1.1
      ],
      [
        -2.1,
        -2.81
      ]
    ]
  },
  {
    "id": "osm_346535466",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -149.5,
    "cz": 48.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.65,
        7.91
      ],
      [
        4.29,
        7.35
      ],
      [
        2.47,
        -11.87
      ],
      [
        -3.47,
        -11.31
      ]
    ]
  },
  {
    "id": "osm_346555828",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 110.2,
    "cz": -112.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.21,
        3.19
      ],
      [
        8.53,
        4.45
      ],
      [
        9.31,
        -4.78
      ],
      [
        -5.42,
        -6.03
      ]
    ]
  },
  {
    "id": "osm_346535372",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -25.5,
    "cz": 155.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.26,
        4.86
      ],
      [
        4.88,
        4.86
      ],
      [
        4.88,
        -7.28
      ],
      [
        -3.26,
        -7.28
      ]
    ]
  },
  {
    "id": "osm_346545728",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 141.1,
    "cz": 70.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.73,
        4.98
      ],
      [
        2.6,
        4.98
      ],
      [
        2.6,
        -7.46
      ],
      [
        -1.73,
        -7.46
      ]
    ]
  },
  {
    "id": "osm_346555756",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 52.1,
    "cz": -148.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.64,
        2.04
      ],
      [
        9.8,
        2.52
      ],
      [
        9.97,
        -3.06
      ],
      [
        -6.47,
        -3.54
      ]
    ]
  },
  {
    "id": "osm_346534850",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -113.3,
    "cz": 111.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.51,
        2.79
      ],
      [
        9.0,
        0.49
      ],
      [
        8.27,
        -4.18
      ],
      [
        -6.25,
        -1.88
      ]
    ]
  },
  {
    "id": "osm_1152477164",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 157.5,
    "cz": -21.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.44,
        2.13
      ],
      [
        -2.9,
        -5.2
      ],
      [
        6.67,
        -3.2
      ],
      [
        5.12,
        4.14
      ]
    ]
  },
  {
    "id": "osm_346535169",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -34.7,
    "cz": 155.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        3.18,
        4.88
      ],
      [
        3.05,
        -7.39
      ],
      [
        -4.77,
        -7.3
      ],
      [
        -4.64,
        4.95
      ]
    ]
  },
  {
    "id": "osm_346555820",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 147.2,
    "cz": -62.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.11,
        1.66
      ],
      [
        2.83,
        3.48
      ],
      [
        4.68,
        -2.49
      ],
      [
        -1.27,
        -4.31
      ]
    ]
  },
  {
    "id": "osm_1087942882",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -83.8,
    "cz": 136.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        8.35,
        3.05
      ],
      [
        6.46,
        -7.85
      ],
      [
        -12.53,
        -4.58
      ],
      [
        -10.65,
        6.33
      ]
    ]
  },
  {
    "id": "osm_346546002",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 116.9,
    "cz": 112.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -8.31,
        7.01
      ],
      [
        2.92,
        7.01
      ],
      [
        2.92,
        -2.02
      ],
      [
        9.56,
        -2.02
      ],
      [
        9.56,
        -8.48
      ],
      [
        -8.31,
        -8.48
      ]
    ]
  },
  {
    "id": "osm_346535718",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -45.1,
    "cz": 155.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        4.02,
        5.37
      ],
      [
        3.65,
        -5.52
      ],
      [
        -0.71,
        -5.37
      ],
      [
        -0.78,
        -7.26
      ],
      [
        -4.45,
        -7.13
      ],
      [
        -4.05,
        4.54
      ],
      [
        -0.85,
        4.42
      ],
      [
        -0.81,
        5.54
      ]
    ]
  },
  {
    "id": "osm_346545711",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 147.3,
    "cz": 71.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.28,
        5.46
      ],
      [
        3.41,
        5.46
      ],
      [
        3.41,
        -8.19
      ],
      [
        -2.28,
        -8.19
      ]
    ]
  },
  {
    "id": "osm_346545941",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 162.4,
    "cz": 25.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.18,
        1.91
      ],
      [
        6.35,
        1.74
      ],
      [
        6.27,
        -2.88
      ],
      [
        -4.26,
        -2.7
      ]
    ]
  },
  {
    "id": "osm_1152477165",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 161.0,
    "cz": -34.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.29,
        4.41
      ],
      [
        -2.5,
        -8.81
      ],
      [
        7.93,
        -6.61
      ],
      [
        5.14,
        6.61
      ]
    ]
  },
  {
    "id": "osm_346545997",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 100.7,
    "cz": 130.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.81,
        5.68
      ],
      [
        7.22,
        5.68
      ],
      [
        7.22,
        -8.52
      ],
      [
        -4.81,
        -8.52
      ]
    ]
  },
  {
    "id": "osm_346535628",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -59.3,
    "cz": 154.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        7.07,
        2.29
      ],
      [
        6.3,
        -5.18
      ],
      [
        -10.6,
        -3.43
      ],
      [
        -9.83,
        4.03
      ]
    ]
  },
  {
    "id": "osm_346545769",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 162.1,
    "cz": 32.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.84,
        2.3
      ],
      [
        5.81,
        2.21
      ],
      [
        5.75,
        -3.45
      ],
      [
        -3.9,
        -3.36
      ]
    ]
  },
  {
    "id": "osm_1086240617",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 50.8,
    "cz": 157.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.62,
        6.02
      ],
      [
        7.28,
        5.74
      ],
      [
        6.93,
        -9.04
      ],
      [
        -4.97,
        -8.76
      ]
    ]
  },
  {
    "id": "osm_346545951",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 141.1,
    "cz": 88.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.2,
        4.68
      ],
      [
        3.3,
        4.68
      ],
      [
        3.3,
        -7.02
      ],
      [
        -2.2,
        -7.02
      ]
    ]
  },
  {
    "id": "osm_343430832",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -93.3,
    "cz": -138.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -9.04,
        7.96
      ],
      [
        17.32,
        -2.24
      ],
      [
        13.56,
        -11.95
      ],
      [
        -12.8,
        -1.75
      ]
    ]
  },
  {
    "id": "osm_346555731",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 72.5,
    "cz": -151.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.77,
        5.4
      ],
      [
        3.39,
        5.75
      ],
      [
        4.16,
        -8.1
      ],
      [
        -2.0,
        -8.45
      ]
    ]
  },
  {
    "id": "osm_346555698",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 52.5,
    "cz": -159.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.53,
        3.97
      ],
      [
        5.11,
        4.14
      ],
      [
        5.3,
        -5.96
      ],
      [
        -3.35,
        -6.13
      ]
    ]
  },
  {
    "id": "osm_346545641",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 74.3,
    "cz": 150.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.73,
        3.56
      ],
      [
        2.95,
        3.37
      ],
      [
        2.61,
        -5.35
      ],
      [
        -2.08,
        -5.16
      ]
    ]
  },
  {
    "id": "osm_346545783",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 161.5,
    "cz": 46.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.17,
        5.78
      ],
      [
        7.84,
        5.69
      ],
      [
        7.75,
        -8.66
      ],
      [
        -5.27,
        -8.57
      ]
    ]
  },
  {
    "id": "osm_346545856",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 153.5,
    "cz": 70.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.93,
        5.11
      ],
      [
        3.2,
        4.99
      ],
      [
        2.89,
        -7.66
      ],
      [
        -2.23,
        -7.54
      ]
    ]
  },
  {
    "id": "osm_346555752",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 92.1,
    "cz": -141.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.06,
        7.27
      ],
      [
        5.22,
        9.43
      ],
      [
        9.09,
        -10.91
      ],
      [
        -2.19,
        -13.04
      ]
    ]
  },
  {
    "id": "osm_346535360",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -151.7,
    "cz": 76.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.06,
        3.15
      ],
      [
        4.42,
        1.83
      ],
      [
        3.1,
        -4.71
      ],
      [
        -3.39,
        -3.4
      ]
    ]
  },
  {
    "id": "osm_346555815",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 112.0,
    "cz": -127.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.52,
        -3.34
      ],
      [
        -5.1,
        4.09
      ],
      [
        6.79,
        5.01
      ],
      [
        7.36,
        -2.43
      ]
    ]
  },
  {
    "id": "osm_1086240618",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 64.9,
    "cz": 157.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.26,
        6.26
      ],
      [
        5.01,
        6.19
      ],
      [
        4.89,
        -9.38
      ],
      [
        -3.39,
        -9.31
      ]
    ]
  },
  {
    "id": "osm_346534776",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -84.4,
    "cz": 147.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.9,
        5.35
      ],
      [
        9.6,
        3.01
      ],
      [
        9.19,
        0.08
      ],
      [
        2.94,
        0.96
      ],
      [
        2.66,
        -0.98
      ],
      [
        8.91,
        -1.87
      ],
      [
        8.14,
        -7.3
      ],
      [
        -8.36,
        -4.96
      ],
      [
        -7.71,
        -0.36
      ],
      [
        -2.19,
        -1.15
      ],
      [
        -1.95,
        0.53
      ],
      [
        -7.46,
        1.32
      ]
    ]
  },
  {
    "id": "osm_346545904",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 80.7,
    "cz": 150.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.36,
        3.26
      ],
      [
        3.46,
        3.32
      ],
      [
        3.56,
        -4.89
      ],
      [
        -2.28,
        -4.95
      ]
    ]
  },
  {
    "id": "osm_346535716",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -147.0,
    "cz": 86.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.45,
        4.41
      ],
      [
        4.61,
        3.3
      ],
      [
        4.07,
        -0.53
      ],
      [
        1.89,
        -0.23
      ],
      [
        1.09,
        -6.09
      ],
      [
        -4.77,
        -5.28
      ]
    ]
  },
  {
    "id": "osm_346555725",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 152.2,
    "cz": -79.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.46,
        4.44
      ],
      [
        4.59,
        7.08
      ],
      [
        8.19,
        -6.66
      ],
      [
        -1.88,
        -9.28
      ]
    ]
  },
  {
    "id": "osm_346555804",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 165.0,
    "cz": -47.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.39,
        2.86
      ],
      [
        7.09,
        6.1
      ],
      [
        9.58,
        -4.28
      ],
      [
        -3.91,
        -7.52
      ]
    ]
  },
  {
    "id": "osm_346535214",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -59.9,
    "cz": 161.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.95,
        -2.31
      ],
      [
        -5.84,
        5.72
      ],
      [
        10.43,
        3.48
      ],
      [
        9.31,
        -4.57
      ]
    ]
  },
  {
    "id": "osm_346545870",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 115.5,
    "cz": 129.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.17,
        4.5
      ],
      [
        3.25,
        4.5
      ],
      [
        3.25,
        -6.76
      ],
      [
        -2.17,
        -6.76
      ]
    ]
  },
  {
    "id": "osm_346545697",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 150.1,
    "cz": 86.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.88,
        5.92
      ],
      [
        6.08,
        5.75
      ],
      [
        5.82,
        -8.89
      ],
      [
        -4.14,
        -8.71
      ]
    ]
  },
  {
    "id": "osm_346545812",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 136.0,
    "cz": 107.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.96,
        2.54
      ],
      [
        5.95,
        2.54
      ],
      [
        5.95,
        -3.82
      ],
      [
        -3.96,
        -3.82
      ]
    ]
  },
  {
    "id": "osm_346535382",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -164.7,
    "cz": 58.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.22,
        -2.05
      ],
      [
        -1.64,
        3.6
      ],
      [
        3.34,
        3.08
      ],
      [
        2.76,
        -2.56
      ]
    ]
  },
  {
    "id": "osm_346545823",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 123.4,
    "cz": 124.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.04,
        -4.56
      ],
      [
        -3.04,
        6.08
      ],
      [
        0.61,
        6.08
      ],
      [
        0.61,
        0.75
      ],
      [
        3.96,
        0.75
      ],
      [
        3.96,
        -4.56
      ]
    ]
  },
  {
    "id": "osm_346545888",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 74.1,
    "cz": 159.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.2,
        2.9
      ],
      [
        3.38,
        2.85
      ],
      [
        3.29,
        -4.36
      ],
      [
        -2.27,
        -4.3
      ]
    ]
  },
  {
    "id": "osm_346535708",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -169.2,
    "cz": 49.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -9.54,
        2.0
      ],
      [
        3.78,
        0.62
      ],
      [
        4.26,
        5.19
      ],
      [
        11.37,
        4.46
      ],
      [
        10.06,
        -8.19
      ],
      [
        -10.38,
        -6.07
      ]
    ]
  },
  {
    "id": "osm_346555817",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 52.0,
    "cz": -169.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.04,
        2.07
      ],
      [
        4.55,
        2.07
      ],
      [
        4.55,
        -3.1
      ],
      [
        -3.04,
        -3.1
      ]
    ]
  },
  {
    "id": "osm_346546006",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 162.9,
    "cz": 69.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.62,
        6.48
      ],
      [
        6.96,
        6.48
      ],
      [
        6.91,
        -9.71
      ],
      [
        -4.62,
        -9.71
      ]
    ]
  },
  {
    "id": "osm_343430828",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -90.9,
    "cz": -152.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.23,
        6.93
      ],
      [
        11.95,
        0.41
      ],
      [
        7.84,
        -10.4
      ],
      [
        -9.33,
        -3.88
      ]
    ]
  },
  {
    "id": "osm_346534837",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -148.0,
    "cz": 99.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.0,
        3.46
      ],
      [
        3.16,
        2.57
      ],
      [
        1.51,
        -5.18
      ],
      [
        -2.65,
        -4.3
      ]
    ]
  },
  {
    "id": "osm_346545730",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 80.8,
    "cz": 159.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.79,
        2.92
      ],
      [
        2.89,
        2.79
      ],
      [
        2.68,
        -4.38
      ],
      [
        -1.99,
        -4.24
      ]
    ]
  },
  {
    "id": "osm_346545919",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 89.5,
    "cz": 155.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.25,
        5.8
      ],
      [
        6.77,
        5.49
      ],
      [
        6.37,
        -8.69
      ],
      [
        -4.65,
        -8.38
      ]
    ]
  },
  {
    "id": "osm_346534875",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -159.1,
    "cz": 84.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.58,
        3.0
      ],
      [
        6.34,
        1.33
      ],
      [
        5.36,
        -4.49
      ],
      [
        -4.56,
        -2.82
      ]
    ]
  },
  {
    "id": "osm_346555837",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 170.2,
    "cz": -60.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.85,
        -5.21
      ],
      [
        -7.85,
        2.06
      ],
      [
        2.82,
        2.06
      ],
      [
        2.82,
        5.77
      ],
      [
        8.95,
        5.77
      ],
      [
        8.95,
        -5.21
      ]
    ]
  },
  {
    "id": "osm_352209864",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -84.2,
    "cz": 160.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.33,
        3.61
      ],
      [
        9.9,
        2.82
      ],
      [
        9.5,
        -5.42
      ],
      [
        -6.73,
        -4.62
      ]
    ]
  },
  {
    "id": "osm_346534946",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -145.9,
    "cz": 108.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.14,
        2.29
      ],
      [
        2.93,
        1.22
      ],
      [
        1.72,
        -3.43
      ],
      [
        -2.36,
        -2.37
      ]
    ]
  },
  {
    "id": "osm_346535024",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -33.8,
    "cz": 179.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.26,
        5.45
      ],
      [
        4.89,
        5.45
      ],
      [
        4.89,
        -8.17
      ],
      [
        -3.26,
        -8.17
      ]
    ]
  },
  {
    "id": "osm_346535714",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -22.7,
    "cz": 181.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.69,
        5.8
      ],
      [
        6.37,
        5.89
      ],
      [
        6.56,
        -12.33
      ],
      [
        -3.86,
        -12.45
      ],
      [
        -4.03,
        3.65
      ],
      [
        -1.67,
        3.67
      ]
    ]
  },
  {
    "id": "osm_346545801",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 99.6,
    "cz": 153.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.76,
        4.85
      ],
      [
        4.48,
        4.65
      ],
      [
        4.15,
        -7.27
      ],
      [
        -3.1,
        -7.07
      ]
    ]
  },
  {
    "id": "osm_343430827",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -110.3,
    "cz": -146.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.37,
        6.76
      ],
      [
        9.56,
        1.93
      ],
      [
        5.04,
        -10.14
      ],
      [
        -7.88,
        -5.32
      ]
    ]
  },
  {
    "id": "osm_346535309",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -157.9,
    "cz": 92.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.72,
        3.77
      ],
      [
        6.68,
        2.35
      ],
      [
        5.59,
        -5.66
      ],
      [
        -4.83,
        -4.23
      ]
    ]
  },
  {
    "id": "osm_346545767",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 162.6,
    "cz": 86.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.95,
        6.0
      ],
      [
        7.43,
        6.0
      ],
      [
        7.43,
        -9.01
      ],
      [
        -4.95,
        -9.01
      ]
    ]
  },
  {
    "id": "osm_346535070",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -166.5,
    "cz": 78.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.93,
        2.92
      ],
      [
        11.13,
        -0.36
      ],
      [
        10.39,
        -4.39
      ],
      [
        -7.65,
        -1.11
      ]
    ]
  },
  {
    "id": "osm_346545796",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 76.8,
    "cz": 167.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.88,
        2.56
      ],
      [
        7.44,
        2.31
      ],
      [
        7.32,
        -3.84
      ],
      [
        -5.0,
        -3.59
      ]
    ]
  },
  {
    "id": "osm_346535182",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -144.7,
    "cz": 115.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.18,
        2.77
      ],
      [
        2.54,
        2.33
      ],
      [
        1.78,
        -4.16
      ],
      [
        -1.96,
        -3.72
      ]
    ]
  },
  {
    "id": "osm_346534896",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -101.8,
    "cz": 154.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.65,
        4.75
      ],
      [
        8.63,
        2.45
      ],
      [
        6.96,
        -7.13
      ],
      [
        -6.31,
        -4.83
      ]
    ]
  },
  {
    "id": "osm_1087942880",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -45.5,
    "cz": 179.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.19,
        5.76
      ],
      [
        4.92,
        5.69
      ],
      [
        4.8,
        -8.64
      ],
      [
        -3.32,
        -8.57
      ]
    ]
  },
  {
    "id": "osm_343430403",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -182.3,
    "cz": -34.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.79,
        4.44
      ],
      [
        10.36,
        0.85
      ],
      [
        8.68,
        -6.66
      ],
      [
        -7.46,
        -3.07
      ]
    ]
  },
  {
    "id": "osm_346545709",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 148.9,
    "cz": 110.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.59,
        5.81
      ],
      [
        6.78,
        5.88
      ],
      [
        6.88,
        -8.7
      ],
      [
        -4.49,
        -8.79
      ]
    ]
  },
  {
    "id": "osm_346545719",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 137.4,
    "cz": 126.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.64,
        5.76
      ],
      [
        6.96,
        5.76
      ],
      [
        6.96,
        -8.64
      ],
      [
        -4.64,
        -8.64
      ]
    ]
  },
  {
    "id": "osm_346555788",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 173.6,
    "cz": -71.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.37,
        3.12
      ],
      [
        9.38,
        3.45
      ],
      [
        9.55,
        -4.69
      ],
      [
        -6.2,
        -5.02
      ]
    ]
  },
  {
    "id": "osm_346545907",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 189.1,
    "cz": 18.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.3,
        3.49
      ],
      [
        6.88,
        2.91
      ],
      [
        6.46,
        -5.24
      ],
      [
        -4.72,
        -4.67
      ]
    ]
  },
  {
    "id": "osm_346545957",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 114.6,
    "cz": 152.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.63,
        6.24
      ],
      [
        5.88,
        5.96
      ],
      [
        5.45,
        -9.35
      ],
      [
        -4.06,
        -9.08
      ]
    ]
  },
  {
    "id": "osm_343430405",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -184.4,
    "cz": -48.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.99,
        3.12
      ],
      [
        7.98,
        2.19
      ],
      [
        7.49,
        -4.67
      ],
      [
        -5.48,
        -3.75
      ]
    ]
  },
  {
    "id": "osm_346555730",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 94.8,
    "cz": -165.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.04,
        1.95
      ],
      [
        8.47,
        3.32
      ],
      [
        9.06,
        -2.93
      ],
      [
        -5.44,
        -4.29
      ]
    ]
  },
  {
    "id": "osm_343430825",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -136.4,
    "cz": -135.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.98,
        3.62
      ],
      [
        10.21,
        -0.38
      ],
      [
        8.96,
        -5.44
      ],
      [
        -7.23,
        -1.43
      ]
    ]
  },
  {
    "id": "osm_346535283",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -83.9,
    "cz": 172.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.49,
        4.23
      ],
      [
        10.01,
        3.79
      ],
      [
        9.73,
        -6.36
      ],
      [
        -6.77,
        -5.91
      ]
    ]
  },
  {
    "id": "osm_346534798",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -169.3,
    "cz": 90.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.48,
        6.34
      ],
      [
        5.5,
        4.74
      ],
      [
        2.22,
        -9.51
      ],
      [
        -4.75,
        -7.91
      ]
    ]
  },
  {
    "id": "osm_346545867",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 161.7,
    "cz": 103.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.92,
        2.2
      ],
      [
        7.38,
        2.2
      ],
      [
        7.38,
        -3.29
      ],
      [
        -4.92,
        -3.29
      ]
    ]
  },
  {
    "id": "osm_343430831",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -87.3,
    "cz": -171.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.65,
        9.6
      ],
      [
        9.93,
        6.73
      ],
      [
        5.46,
        -14.39
      ],
      [
        -8.11,
        -11.52
      ]
    ]
  },
  {
    "id": "osm_346545755",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 186.8,
    "cz": 48.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.9,
        2.55
      ],
      [
        4.35,
        2.55
      ],
      [
        4.35,
        -3.83
      ],
      [
        -2.9,
        -3.83
      ]
    ]
  },
  {
    "id": "osm_346545835",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 190.8,
    "cz": 31.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.02,
        1.8
      ],
      [
        4.24,
        2.25
      ],
      [
        4.53,
        -2.7
      ],
      [
        -2.72,
        -3.14
      ]
    ]
  },
  {
    "id": "osm_346545877",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 146.9,
    "cz": 126.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.01,
        5.36
      ],
      [
        3.01,
        5.36
      ],
      [
        3.01,
        -8.04
      ],
      [
        -2.01,
        -8.04
      ]
    ]
  },
  {
    "id": "osm_346535016",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -98.7,
    "cz": 167.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.8,
        4.76
      ],
      [
        7.8,
        2.01
      ],
      [
        8.12,
        -0.57
      ],
      [
        6.13,
        -6.84
      ],
      [
        -8.47,
        -4.1
      ]
    ]
  },
  {
    "id": "osm_346545670",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 191.2,
    "cz": 37.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.85,
        1.26
      ],
      [
        5.44,
        2.06
      ],
      [
        5.78,
        -1.89
      ],
      [
        -3.52,
        -2.69
      ]
    ]
  },
  {
    "id": "osm_346545747",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 103.1,
    "cz": 166.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        3.62,
        -5.19
      ],
      [
        -5.92,
        -4.82
      ],
      [
        -5.43,
        7.78
      ],
      [
        4.11,
        7.4
      ]
    ]
  },
  {
    "id": "osm_346545778",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 160.6,
    "cz": 112.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.46,
        2.64
      ],
      [
        6.69,
        2.64
      ],
      [
        6.69,
        -3.97
      ],
      [
        -4.46,
        -3.97
      ]
    ]
  },
  {
    "id": "osm_343430406",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -186.3,
    "cz": -62.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.08,
        5.02
      ],
      [
        8.49,
        1.88
      ],
      [
        6.13,
        -7.54
      ],
      [
        -6.45,
        -4.4
      ]
    ]
  },
  {
    "id": "osm_346545787",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 123.0,
    "cz": 153.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.52,
        3.92
      ],
      [
        2.55,
        3.81
      ],
      [
        2.28,
        -5.89
      ],
      [
        -1.79,
        -5.78
      ]
    ]
  },
  {
    "id": "osm_346535366",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -190.8,
    "cz": 52.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.09,
        5.65
      ],
      [
        9.12,
        3.61
      ],
      [
        6.88,
        -8.62
      ],
      [
        -4.96,
        -6.45
      ],
      [
        -3.76,
        0.13
      ],
      [
        -3.12,
        0.01
      ]
    ]
  },
  {
    "id": "osm_346545663",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 188.5,
    "cz": 61.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.48,
        1.84
      ],
      [
        5.02,
        2.19
      ],
      [
        5.22,
        -2.76
      ],
      [
        -3.28,
        -3.12
      ]
    ]
  },
  {
    "id": "osm_346545692",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 152.9,
    "cz": 126.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.05,
        5.27
      ],
      [
        3.08,
        5.27
      ],
      [
        3.08,
        -7.91
      ],
      [
        -2.05,
        -7.91
      ]
    ]
  },
  {
    "id": "osm_346555743",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 52.6,
    "cz": -192.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.01,
        3.38
      ],
      [
        10.03,
        4.26
      ],
      [
        10.52,
        -5.07
      ],
      [
        -6.53,
        -5.96
      ]
    ]
  },
  {
    "id": "osm_346535349",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -32.3,
    "cz": 197.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -11.29,
        0.16
      ],
      [
        -6.26,
        0.09
      ],
      [
        -6.21,
        3.92
      ],
      [
        -2.6,
        3.87
      ],
      [
        -2.55,
        7.13
      ],
      [
        5.9,
        7.03
      ],
      [
        5.92,
        8.6
      ],
      [
        13.76,
        8.51
      ],
      [
        13.54,
        -9.02
      ],
      [
        6.24,
        -8.94
      ],
      [
        6.22,
        -10.84
      ],
      [
        -11.41,
        -10.63
      ]
    ]
  },
  {
    "id": "osm_343430826",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -139.5,
    "cz": -143.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.65,
        4.05
      ],
      [
        11.37,
        -0.32
      ],
      [
        9.98,
        -6.07
      ],
      [
        -8.05,
        -1.7
      ]
    ]
  },
  {
    "id": "osm_346545884",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 128.4,
    "cz": 153.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.95,
        3.35
      ],
      [
        3.16,
        3.21
      ],
      [
        2.92,
        -5.04
      ],
      [
        -2.19,
        -4.88
      ]
    ]
  },
  {
    "id": "osm_346545658",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 50.3,
    "cz": 193.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.03,
        2.88
      ],
      [
        3.29,
        2.71
      ],
      [
        3.04,
        -4.32
      ],
      [
        -2.28,
        -4.13
      ]
    ]
  },
  {
    "id": "osm_346545717",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 199.5,
    "cz": 19.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.84,
        4.1
      ],
      [
        3.28,
        3.85
      ],
      [
        2.77,
        -6.16
      ],
      [
        -2.35,
        -5.9
      ]
    ]
  },
  {
    "id": "osm_346545764",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 188.4,
    "cz": 68.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.1,
        2.38
      ],
      [
        6.1,
        2.46
      ],
      [
        6.16,
        -3.57
      ],
      [
        -4.06,
        -3.64
      ]
    ]
  },
  {
    "id": "osm_346545853",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 196.4,
    "cz": 43.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.31,
        1.7
      ],
      [
        4.84,
        1.91
      ],
      [
        4.96,
        -2.56
      ],
      [
        -3.19,
        -2.77
      ]
    ]
  },
  {
    "id": "osm_1070105459",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 164.0,
    "cz": -116.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -10.9,
        16.3
      ],
      [
        4.2,
        -28.55
      ],
      [
        16.36,
        -24.45
      ],
      [
        1.25,
        20.4
      ]
    ]
  },
  {
    "id": "osm_346545718",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 57.3,
    "cz": 193.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.87,
        3.53
      ],
      [
        3.05,
        3.38
      ],
      [
        2.82,
        -5.3
      ],
      [
        -2.11,
        -5.16
      ]
    ]
  },
  {
    "id": "osm_346545860",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 161.5,
    "cz": 121.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.64,
        3.08
      ],
      [
        6.95,
        3.08
      ],
      [
        6.95,
        -4.61
      ],
      [
        -4.64,
        -4.61
      ]
    ]
  },
  {
    "id": "osm_346555717",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 152.7,
    "cz": -132.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.94,
        4.22
      ],
      [
        6.26,
        8.04
      ],
      [
        10.42,
        -6.32
      ],
      [
        -2.8,
        -10.15
      ]
    ]
  },
  {
    "id": "osm_346545898",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 62.8,
    "cz": 193.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.22,
        3.84
      ],
      [
        2.34,
        3.65
      ],
      [
        1.81,
        -5.75
      ],
      [
        -1.72,
        -5.56
      ]
    ]
  },
  {
    "id": "osm_346545646",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 111.7,
    "cz": 169.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.2,
        -3.25
      ],
      [
        -3.14,
        4.95
      ],
      [
        4.81,
        4.88
      ],
      [
        4.75,
        -3.31
      ]
    ]
  },
  {
    "id": "osm_346545993",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 133.8,
    "cz": 153.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.58,
        3.63
      ],
      [
        2.61,
        3.52
      ],
      [
        2.35,
        -5.46
      ],
      [
        -1.82,
        -5.32
      ]
    ]
  },
  {
    "id": "osm_1087942883",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -155.6,
    "cz": 132.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.03,
        5.17
      ],
      [
        11.05,
        1.44
      ],
      [
        9.05,
        -7.75
      ],
      [
        -8.03,
        -4.02
      ]
    ]
  },
  {
    "id": "osm_346545984",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 67.8,
    "cz": 192.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.0,
        3.18
      ],
      [
        3.18,
        3.06
      ],
      [
        3.0,
        -4.76
      ],
      [
        -2.19,
        -4.64
      ]
    ]
  },
  {
    "id": "osm_343430830",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -105.9,
    "cz": -175.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.66,
        4.8
      ],
      [
        -4.4,
        -5.84
      ],
      [
        3.98,
        -7.2
      ],
      [
        5.72,
        3.43
      ]
    ]
  },
  {
    "id": "osm_346534846",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -82.0,
    "cz": 187.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.9,
        5.26
      ],
      [
        10.63,
        8.7
      ],
      [
        8.51,
        -10.41
      ],
      [
        -7.32,
        -8.81
      ]
    ]
  },
  {
    "id": "osm_343430404",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -188.6,
    "cz": -80.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.52,
        5.59
      ],
      [
        8.26,
        2.33
      ],
      [
        5.29,
        -8.4
      ],
      [
        -6.5,
        -5.13
      ]
    ]
  },
  {
    "id": "osm_346535342",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -188.2,
    "cz": 83.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.39,
        3.58
      ],
      [
        4.38,
        1.7
      ],
      [
        2.08,
        -5.38
      ],
      [
        -3.7,
        -3.5
      ]
    ]
  },
  {
    "id": "osm_346545883",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 74.7,
    "cz": 192.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.53,
        3.43
      ],
      [
        4.14,
        3.16
      ],
      [
        3.79,
        -5.15
      ],
      [
        -2.86,
        -4.89
      ]
    ]
  },
  {
    "id": "osm_346545891",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 205.3,
    "cz": 19.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.92,
        4.07
      ],
      [
        3.16,
        3.92
      ],
      [
        2.88,
        -6.09
      ],
      [
        -2.2,
        -5.95
      ]
    ]
  },
  {
    "id": "osm_346545829",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 197.2,
    "cz": 64.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.81,
        2.01
      ],
      [
        2.66,
        2.07
      ],
      [
        2.72,
        -3.02
      ],
      [
        -1.75,
        -3.09
      ]
    ]
  },
  {
    "id": "osm_346545696",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 139.7,
    "cz": 153.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.68,
        3.35
      ],
      [
        4.27,
        3.15
      ],
      [
        4.02,
        -5.02
      ],
      [
        -2.91,
        -4.82
      ]
    ]
  },
  {
    "id": "osm_1070105457",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 182.5,
    "cz": -99.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -9.81,
        4.85
      ],
      [
        7.81,
        11.39
      ],
      [
        14.73,
        -7.28
      ],
      [
        -2.9,
        -13.82
      ]
    ]
  },
  {
    "id": "osm_346555838",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 79.1,
    "cz": -192.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -8.65,
        26.94
      ],
      [
        6.77,
        27.85
      ],
      [
        9.33,
        -15.21
      ],
      [
        3.1,
        -15.59
      ],
      [
        3.66,
        -25.19
      ],
      [
        -5.53,
        -25.74
      ]
    ]
  },
  {
    "id": "osm_346555737",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 53.2,
    "cz": -201.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.79,
        2.39
      ],
      [
        2.58,
        2.48
      ],
      [
        2.68,
        -3.58
      ],
      [
        -1.68,
        -3.67
      ]
    ]
  },
  {
    "id": "osm_1455911863",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -200.6,
    "cz": 59.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.17,
        10.34
      ],
      [
        8.41,
        7.57
      ],
      [
        1.74,
        -15.51
      ],
      [
        -7.83,
        -12.74
      ]
    ]
  },
  {
    "id": "osm_346534906",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -182.7,
    "cz": 102.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        6.93,
        1.95
      ],
      [
        5.51,
        -5.83
      ],
      [
        -10.38,
        -2.93
      ],
      [
        -8.97,
        4.85
      ]
    ]
  },
  {
    "id": "osm_346555799",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 59.2,
    "cz": -201.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.31,
        2.18
      ],
      [
        3.11,
        2.5
      ],
      [
        3.45,
        -3.27
      ],
      [
        -1.96,
        -3.59
      ]
    ]
  },
  {
    "id": "osm_346545822",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 206.7,
    "cz": 35.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.7,
        0.89
      ],
      [
        4.71,
        2.66
      ],
      [
        5.55,
        -1.34
      ],
      [
        -2.86,
        -3.12
      ]
    ]
  },
  {
    "id": "osm_346545831",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 127.3,
    "cz": 166.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.78,
        5.12
      ],
      [
        4.17,
        5.12
      ],
      [
        4.17,
        -7.68
      ],
      [
        -2.78,
        -7.68
      ]
    ]
  },
  {
    "id": "osm_346555794",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 119.2,
    "cz": -172.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.92,
        0.98
      ],
      [
        8.37,
        2.69
      ],
      [
        8.87,
        -1.46
      ],
      [
        -5.41,
        -3.17
      ]
    ]
  },
  {
    "id": "osm_346545828",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 52.0,
    "cz": 203.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.69,
        3.19
      ],
      [
        7.19,
        2.94
      ],
      [
        7.03,
        -4.77
      ],
      [
        -4.86,
        -4.53
      ]
    ]
  },
  {
    "id": "osm_343430829",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -122.1,
    "cz": -171.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.5,
        5.51
      ],
      [
        12.1,
        0.51
      ],
      [
        9.74,
        -8.26
      ],
      [
        -8.86,
        -3.26
      ]
    ]
  },
  {
    "id": "osm_346545649",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 205.4,
    "cz": 47.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.63,
        1.13
      ],
      [
        4.6,
        2.72
      ],
      [
        5.45,
        -1.7
      ],
      [
        -2.78,
        -3.29
      ]
    ]
  },
  {
    "id": "osm_1225572734",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 211.4,
    "cz": 18.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.92,
        4.07
      ],
      [
        3.16,
        3.92
      ],
      [
        2.88,
        -6.09
      ],
      [
        -2.2,
        -5.95
      ]
    ]
  },
  {
    "id": "osm_346545775",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 185.3,
    "cz": 103.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.83,
        3.29
      ],
      [
        4.53,
        3.03
      ],
      [
        4.25,
        -4.94
      ],
      [
        -3.12,
        -4.68
      ]
    ]
  },
  {
    "id": "osm_346545811",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 64.0,
    "cz": 202.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.91,
        3.02
      ],
      [
        4.6,
        2.76
      ],
      [
        4.36,
        -4.52
      ],
      [
        -3.16,
        -4.27
      ]
    ]
  },
  {
    "id": "osm_346545793",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 148.4,
    "cz": 152.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.7,
        2.55
      ],
      [
        5.73,
        2.29
      ],
      [
        5.56,
        -3.84
      ],
      [
        -3.87,
        -3.57
      ]
    ]
  },
  {
    "id": "osm_346545712",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 92.7,
    "cz": 191.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.91,
        3.47
      ],
      [
        3.29,
        3.21
      ],
      [
        2.87,
        -5.2
      ],
      [
        -2.32,
        -4.95
      ]
    ]
  },
  {
    "id": "osm_346535477",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -110.3,
    "cz": 182.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -11.61,
        1.12
      ],
      [
        14.94,
        7.93
      ],
      [
        17.41,
        -1.67
      ],
      [
        -9.14,
        -8.49
      ]
    ]
  },
  {
    "id": "osm_343434818",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -211.6,
    "cz": -30.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.84,
        6.33
      ],
      [
        12.89,
        1.68
      ],
      [
        10.26,
        -9.49
      ],
      [
        -9.48,
        -4.84
      ]
    ]
  },
  {
    "id": "osm_346546009",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 196.5,
    "cz": 86.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -11.99,
        6.99
      ],
      [
        12.75,
        8.11
      ],
      [
        13.19,
        -1.67
      ],
      [
        4.47,
        -2.06
      ],
      [
        4.78,
        -8.82
      ],
      [
        -11.24,
        -9.55
      ]
    ]
  },
  {
    "id": "osm_346545949",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 204.2,
    "cz": 67.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.12,
        2.81
      ],
      [
        4.74,
        2.75
      ],
      [
        4.68,
        -4.22
      ],
      [
        -3.17,
        -4.15
      ]
    ]
  },
  {
    "id": "osm_346545742",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 134.2,
    "cz": 168.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.03,
        6.2
      ],
      [
        3.28,
        6.13
      ],
      [
        3.06,
        -9.3
      ],
      [
        -2.26,
        -9.23
      ]
    ]
  },
  {
    "id": "osm_343434790",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -194.1,
    "cz": -93.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.06,
        5.71
      ],
      [
        11.3,
        2.12
      ],
      [
        9.09,
        -8.56
      ],
      [
        -8.27,
        -4.97
      ]
    ]
  },
  {
    "id": "osm_346534880",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -176.8,
    "cz": -124.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -13.3,
        11.51
      ],
      [
        24.49,
        3.1
      ],
      [
        19.96,
        -17.27
      ],
      [
        -17.83,
        -8.87
      ]
    ]
  },
  {
    "id": "osm_346535251",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 26.8,
    "cz": 214.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.94,
        5.91
      ],
      [
        9.01,
        5.83
      ],
      [
        8.92,
        -8.88
      ],
      [
        -6.03,
        -8.79
      ]
    ]
  },
  {
    "id": "osm_346545876",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 76.8,
    "cz": 202.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.45,
        3.88
      ],
      [
        7.24,
        3.13
      ],
      [
        6.67,
        -5.82
      ],
      [
        -5.03,
        -5.06
      ]
    ]
  },
  {
    "id": "osm_343434825",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -90.8,
    "cz": -196.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.74,
        5.68
      ],
      [
        5.23,
        4.24
      ],
      [
        2.6,
        -8.53
      ],
      [
        -4.37,
        -7.09
      ]
    ]
  },
  {
    "id": "osm_346545679",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 148.1,
    "cz": 159.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.02,
        1.6
      ],
      [
        6.05,
        1.54
      ],
      [
        6.03,
        -2.41
      ],
      [
        -4.05,
        -2.34
      ]
    ]
  },
  {
    "id": "osm_346545691",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 184.8,
    "cz": 114.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.76,
        2.45
      ],
      [
        2.84,
        2.29
      ],
      [
        2.62,
        -3.69
      ],
      [
        -1.95,
        -3.52
      ]
    ]
  },
  {
    "id": "osm_346546005",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 161.3,
    "cz": 146.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.12,
        1.97
      ],
      [
        -0.63,
        1.85
      ],
      [
        -0.58,
        3.58
      ],
      [
        8.55,
        3.33
      ],
      [
        8.27,
        -6.54
      ],
      [
        -5.35,
        -6.15
      ]
    ]
  },
  {
    "id": "osm_346546003",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 100.9,
    "cz": 193.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.11,
        3.85
      ],
      [
        4.59,
        3.73
      ],
      [
        4.45,
        -6.03
      ],
      [
        1.64,
        -5.99
      ],
      [
        1.73,
        0.24
      ],
      [
        -4.16,
        0.33
      ]
    ]
  },
  {
    "id": "osm_346545864",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 193.6,
    "cz": 103.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.73,
        2.76
      ],
      [
        2.84,
        2.61
      ],
      [
        2.6,
        -4.14
      ],
      [
        -1.98,
        -3.97
      ]
    ]
  },
  {
    "id": "osm_1086238609",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -53.2,
    "cz": 213.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -9.9,
        1.64
      ],
      [
        -8.52,
        -6.43
      ],
      [
        14.84,
        -2.45
      ],
      [
        13.46,
        5.61
      ]
    ]
  },
  {
    "id": "osm_346545850",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 144.4,
    "cz": 166.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.81,
        6.61
      ],
      [
        10.81,
        5.96
      ],
      [
        10.54,
        -1.16
      ],
      [
        -1.52,
        -0.68
      ],
      [
        -1.83,
        -8.75
      ],
      [
        -6.4,
        -8.57
      ]
    ]
  },
  {
    "id": "osm_346545761",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 111.4,
    "cz": 190.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.23,
        2.91
      ],
      [
        3.78,
        2.54
      ],
      [
        3.34,
        -4.36
      ],
      [
        -2.67,
        -3.98
      ]
    ]
  },
  {
    "id": "osm_346555718",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 57.9,
    "cz": -212.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        1.96,
        2.39
      ],
      [
        2.45,
        -3.1
      ],
      [
        -2.93,
        -3.58
      ],
      [
        -3.42,
        1.91
      ]
    ]
  },
  {
    "id": "osm_346545859",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 189.8,
    "cz": 114.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.55,
        2.56
      ],
      [
        2.55,
        2.41
      ],
      [
        2.33,
        -3.83
      ],
      [
        -1.78,
        -3.69
      ]
    ]
  },
  {
    "id": "osm_346555723",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 50.1,
    "cz": -216.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.74,
        7.5
      ],
      [
        4.12,
        7.5
      ],
      [
        4.12,
        -11.25
      ],
      [
        -2.74,
        -11.25
      ]
    ]
  },
  {
    "id": "osm_346534778",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -213.2,
    "cz": 61.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.0,
        11.9
      ],
      [
        9.65,
        8.61
      ],
      [
        1.48,
        -17.84
      ],
      [
        -9.15,
        -14.56
      ]
    ]
  },
  {
    "id": "osm_352209865",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -69.9,
    "cz": 210.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.66,
        1.8
      ],
      [
        4.5,
        3.19
      ],
      [
        5.5,
        -2.69
      ],
      [
        -2.66,
        -4.08
      ]
    ]
  },
  {
    "id": "osm_346545972",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 93.1,
    "cz": 201.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.51,
        2.13
      ],
      [
        4.0,
        1.81
      ],
      [
        3.76,
        -3.19
      ],
      [
        -2.75,
        -2.86
      ]
    ]
  },
  {
    "id": "osm_343434817",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -216.7,
    "cz": -51.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -10.89,
        -8.45
      ],
      [
        -6.51,
        8.34
      ],
      [
        5.33,
        5.25
      ],
      [
        6.23,
        8.68
      ],
      [
        11.0,
        7.43
      ],
      [
        5.74,
        -12.77
      ]
    ]
  },
  {
    "id": "osm_346535429",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -208.7,
    "cz": 80.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.84,
        4.73
      ],
      [
        7.17,
        1.22
      ],
      [
        4.27,
        -7.09
      ],
      [
        -5.75,
        -3.58
      ]
    ]
  },
  {
    "id": "osm_346545676",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 212.9,
    "cz": 69.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.44,
        2.81
      ],
      [
        3.51,
        2.93
      ],
      [
        3.66,
        -4.21
      ],
      [
        -2.28,
        -4.33
      ]
    ]
  },
  {
    "id": "osm_346555806",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 63.3,
    "cz": -214.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.09,
        1.84
      ],
      [
        2.8,
        2.16
      ],
      [
        3.12,
        -2.76
      ],
      [
        -1.76,
        -3.09
      ]
    ]
  },
  {
    "id": "osm_1087942884",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -177.2,
    "cz": 137.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.55,
        5.12
      ],
      [
        10.4,
        1.57
      ],
      [
        8.34,
        -7.68
      ],
      [
        -7.62,
        -4.11
      ]
    ]
  },
  {
    "id": "osm_346535374",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -199.5,
    "cz": 101.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        5.05,
        0.93
      ],
      [
        3.45,
        -4.59
      ],
      [
        -7.58,
        -1.39
      ],
      [
        -5.97,
        4.14
      ]
    ]
  },
  {
    "id": "osm_346535147",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -206.3,
    "cz": 87.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.36,
        3.9
      ],
      [
        7.09,
        0.58
      ],
      [
        5.04,
        -5.84
      ],
      [
        -5.4,
        -2.52
      ]
    ]
  },
  {
    "id": "osm_1211325474",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -115.7,
    "cz": -192.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.45,
        -3.75
      ],
      [
        3.59,
        -4.83
      ],
      [
        5.18,
        5.62
      ],
      [
        -1.86,
        6.69
      ]
    ]
  },
  {
    "id": "osm_346545715",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 187.5,
    "cz": 124.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.52,
        2.17
      ],
      [
        5.47,
        1.85
      ],
      [
        5.28,
        -3.25
      ],
      [
        -3.69,
        -2.93
      ]
    ]
  },
  {
    "id": "osm_346545921",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 122.9,
    "cz": 188.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.11,
        3.29
      ],
      [
        3.58,
        3.0
      ],
      [
        3.18,
        -4.93
      ],
      [
        -2.52,
        -4.64
      ]
    ]
  },
  {
    "id": "osm_1070105458",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 190.0,
    "cz": -121.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -9.74,
        3.31
      ],
      [
        -4.43,
        -11.71
      ],
      [
        14.62,
        -4.97
      ],
      [
        9.31,
        10.06
      ]
    ]
  },
  {
    "id": "osm_346534974",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -204.4,
    "cz": 95.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.68,
        3.9
      ],
      [
        7.45,
        0.59
      ],
      [
        5.52,
        -5.87
      ],
      [
        -5.61,
        -2.53
      ]
    ]
  },
  {
    "id": "osm_346555836",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 122.7,
    "cz": -190.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.08,
        1.14
      ],
      [
        0.2,
        1.86
      ],
      [
        -0.33,
        5.73
      ],
      [
        6.04,
        6.6
      ],
      [
        7.97,
        -7.42
      ],
      [
        -3.69,
        -9.02
      ]
    ]
  },
  {
    "id": "osm_346545934",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 201.6,
    "cz": 102.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.09,
        3.11
      ],
      [
        3.4,
        2.92
      ],
      [
        3.13,
        -4.67
      ],
      [
        -2.37,
        -4.48
      ]
    ]
  },
  {
    "id": "osm_346510803",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -49.3,
    "cz": 221.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.6,
        1.09
      ],
      [
        9.37,
        2.93
      ],
      [
        9.9,
        -1.62
      ],
      [
        -6.08,
        -3.47
      ]
    ]
  },
  {
    "id": "osm_346545881",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 212.0,
    "cz": 80.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.12,
        2.23
      ],
      [
        3.19,
        2.23
      ],
      [
        3.19,
        -3.35
      ],
      [
        -2.12,
        -3.35
      ]
    ]
  },
  {
    "id": "osm_346534780",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -31.2,
    "cz": 225.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -8.47,
        6.83
      ],
      [
        11.55,
        8.09
      ],
      [
        12.69,
        -10.25
      ],
      [
        -7.32,
        -11.49
      ]
    ]
  },
  {
    "id": "osm_346535407",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -199.9,
    "cz": 108.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.76,
        2.76
      ],
      [
        6.74,
        -0.06
      ],
      [
        5.65,
        -4.14
      ],
      [
        -4.87,
        -1.33
      ]
    ]
  },
  {
    "id": "osm_346535638",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 51.9,
    "cz": 221.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.48,
        -7.47
      ],
      [
        -4.21,
        1.82
      ],
      [
        -2.69,
        1.77
      ],
      [
        -2.46,
        9.79
      ],
      [
        9.4,
        9.43
      ],
      [
        8.89,
        -7.87
      ]
    ]
  },
  {
    "id": "osm_346534977",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 64.1,
    "cz": 218.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.51,
        3.18
      ],
      [
        2.73,
        2.91
      ],
      [
        2.26,
        -4.78
      ],
      [
        -1.99,
        -4.51
      ]
    ]
  },
  {
    "id": "osm_346545875",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 226.6,
    "cz": 22.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.17,
        5.72
      ],
      [
        8.02,
        5.48
      ],
      [
        7.75,
        -8.59
      ],
      [
        -5.43,
        -8.35
      ]
    ]
  },
  {
    "id": "osm_346555706",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 56.9,
    "cz": -220.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.65,
        2.59
      ],
      [
        2.47,
        2.59
      ],
      [
        2.47,
        -3.88
      ],
      [
        -1.65,
        -3.88
      ]
    ]
  },
  {
    "id": "osm_1211325475",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -123.4,
    "cz": -191.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.45,
        -4.19
      ],
      [
        3.7,
        -5.11
      ],
      [
        5.17,
        6.27
      ],
      [
        -1.98,
        7.2
      ]
    ]
  },
  {
    "id": "osm_346545799",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 129.4,
    "cz": 188.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.42,
        3.1
      ],
      [
        3.64,
        3.1
      ],
      [
        3.64,
        -4.65
      ],
      [
        -2.42,
        -4.65
      ]
    ]
  },
  {
    "id": "osm_346545939",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 187.6,
    "cz": 130.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.45,
        2.25
      ],
      [
        5.36,
        1.94
      ],
      [
        5.16,
        -3.37
      ],
      [
        -3.64,
        -3.05
      ]
    ]
  },
  {
    "id": "osm_346545765",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 222.5,
    "cz": 51.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.57,
        2.19
      ],
      [
        2.59,
        2.01
      ],
      [
        2.36,
        -3.29
      ],
      [
        -1.8,
        -3.11
      ]
    ]
  },
  {
    "id": "osm_346545847",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 112.3,
    "cz": 199.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.12,
        3.02
      ],
      [
        6.3,
        2.85
      ],
      [
        6.19,
        -4.52
      ],
      [
        -4.24,
        -4.35
      ]
    ]
  },
  {
    "id": "osm_346510734",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -62.6,
    "cz": 219.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.67,
        1.8
      ],
      [
        4.5,
        3.19
      ],
      [
        5.49,
        -2.69
      ],
      [
        -2.67,
        -4.08
      ]
    ]
  },
  {
    "id": "osm_346545810",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 195.3,
    "cz": 119.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.67,
        5.04
      ],
      [
        2.95,
        4.86
      ],
      [
        2.5,
        -7.54
      ],
      [
        -2.11,
        -7.38
      ]
    ]
  },
  {
    "id": "osm_352209844",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -72.0,
    "cz": 217.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.66,
        1.8
      ],
      [
        4.5,
        3.17
      ],
      [
        5.49,
        -2.7
      ],
      [
        -2.66,
        -4.09
      ]
    ]
  },
  {
    "id": "osm_346535432",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 78.4,
    "cz": 215.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.12,
        3.25
      ],
      [
        6.33,
        3.08
      ],
      [
        6.19,
        -4.88
      ],
      [
        -4.27,
        -4.69
      ]
    ]
  },
  {
    "id": "osm_343434827",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -130.3,
    "cz": -189.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.75,
        -4.31
      ],
      [
        2.71,
        -4.97
      ],
      [
        4.11,
        6.46
      ],
      [
        -1.34,
        7.14
      ]
    ]
  },
  {
    "id": "osm_346510977",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -90.5,
    "cz": 212.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.06,
        4.71
      ],
      [
        8.46,
        7.04
      ],
      [
        10.48,
        -3.76
      ],
      [
        -3.82,
        -6.43
      ],
      [
        -4.39,
        -3.31
      ],
      [
        -2.62,
        -2.97
      ]
    ]
  },
  {
    "id": "osm_346545750",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 227.4,
    "cz": 39.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.79,
        4.93
      ],
      [
        5.83,
        4.81
      ],
      [
        5.69,
        -7.4
      ],
      [
        -3.94,
        -7.29
      ]
    ]
  },
  {
    "id": "osm_346545686",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 208.1,
    "cz": 101.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.81,
        3.89
      ],
      [
        3.04,
        3.72
      ],
      [
        2.71,
        -5.83
      ],
      [
        -2.14,
        -5.67
      ]
    ]
  },
  {
    "id": "osm_346545781",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 187.8,
    "cz": 136.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.93,
        2.45
      ],
      [
        6.09,
        2.08
      ],
      [
        5.89,
        -3.67
      ],
      [
        -4.14,
        -3.31
      ]
    ]
  },
  {
    "id": "osm_346545745",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 122.1,
    "cz": 197.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.86,
        2.47
      ],
      [
        2.96,
        2.33
      ],
      [
        2.79,
        -3.71
      ],
      [
        -2.03,
        -3.58
      ]
    ]
  },
  {
    "id": "osm_346545989",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 137.8,
    "cz": 187.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.54,
        2.94
      ],
      [
        5.42,
        2.8
      ],
      [
        5.31,
        -4.39
      ],
      [
        -3.65,
        -4.27
      ]
    ]
  },
  {
    "id": "osm_346545873",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 200.3,
    "cz": 119.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.61,
        4.54
      ],
      [
        2.81,
        4.37
      ],
      [
        2.42,
        -6.81
      ],
      [
        -2.01,
        -6.66
      ]
    ]
  },
  {
    "id": "osm_343434826",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -104.7,
    "cz": -208.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.66,
        7.06
      ],
      [
        11.9,
        2.48
      ],
      [
        8.48,
        -10.6
      ],
      [
        -9.07,
        -6.02
      ]
    ]
  },
  {
    "id": "osm_346510604",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -112.5,
    "cz": 204.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.88,
        -4.67
      ],
      [
        -4.36,
        5.76
      ],
      [
        4.31,
        6.99
      ],
      [
        5.8,
        -3.42
      ]
    ]
  },
  {
    "id": "osm_346545857",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 164.5,
    "cz": 165.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        4.7,
        6.55
      ],
      [
        5.01,
        -9.59
      ],
      [
        -7.04,
        -9.82
      ],
      [
        -7.35,
        6.31
      ]
    ]
  },
  {
    "id": "osm_346545933",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 223.0,
    "cz": 70.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.64,
        1.76
      ],
      [
        2.25,
        1.94
      ],
      [
        2.45,
        -2.65
      ],
      [
        -1.44,
        -2.83
      ]
    ]
  },
  {
    "id": "osm_346534991",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -193.1,
    "cz": 132.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.0,
        3.51
      ],
      [
        5.88,
        1.76
      ],
      [
        4.49,
        -5.27
      ],
      [
        -4.39,
        -3.51
      ]
    ]
  },
  {
    "id": "osm_346555808",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 106.3,
    "cz": -209.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.07,
        1.67
      ],
      [
        2.5,
        2.25
      ],
      [
        3.1,
        -2.5
      ],
      [
        -1.47,
        -3.07
      ]
    ]
  },
  {
    "id": "osm_1070105462",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 138.3,
    "cz": -189.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.3,
        2.16
      ],
      [
        9.47,
        5.15
      ],
      [
        10.96,
        -3.23
      ],
      [
        -5.81,
        -6.23
      ]
    ]
  },
  {
    "id": "osm_346534864",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 64.3,
    "cz": 225.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.54,
        2.02
      ],
      [
        2.62,
        1.75
      ],
      [
        2.32,
        -3.04
      ],
      [
        -1.84,
        -2.77
      ]
    ]
  },
  {
    "id": "osm_343434816",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -222.3,
    "cz": -76.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -11.25,
        4.77
      ],
      [
        18.09,
        -0.91
      ],
      [
        16.88,
        -7.15
      ],
      [
        -12.46,
        -1.47
      ]
    ]
  },
  {
    "id": "osm_346534930",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 94.3,
    "cz": 215.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.77,
        3.22
      ],
      [
        5.9,
        2.93
      ],
      [
        5.66,
        -4.83
      ],
      [
        -4.0,
        -4.54
      ]
    ]
  },
  {
    "id": "osm_346510514",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -135.2,
    "cz": 192.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.12,
        2.29
      ],
      [
        4.05,
        3.0
      ],
      [
        4.68,
        -3.44
      ],
      [
        -2.48,
        -4.14
      ]
    ]
  },
  {
    "id": "osm_352209848",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -128.3,
    "cz": 197.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.44,
        4.06
      ],
      [
        2.98,
        4.42
      ],
      [
        3.64,
        -6.09
      ],
      [
        -1.72,
        -6.44
      ]
    ]
  },
  {
    "id": "osm_346545809",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 129.2,
    "cz": 197.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.82,
        3.14
      ],
      [
        2.63,
        3.2
      ],
      [
        2.72,
        -4.72
      ],
      [
        -1.73,
        -4.77
      ]
    ]
  },
  {
    "id": "osm_346545766",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 195.8,
    "cz": 133.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.38,
        4.33
      ],
      [
        2.46,
        4.19
      ],
      [
        2.08,
        -6.5
      ],
      [
        -1.78,
        -6.35
      ]
    ]
  },
  {
    "id": "osm_346545982",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 205.2,
    "cz": 118.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.8,
        5.03
      ],
      [
        3.15,
        4.85
      ],
      [
        2.71,
        -7.55
      ],
      [
        -2.24,
        -7.37
      ]
    ]
  },
  {
    "id": "osm_346535218",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 75.2,
    "cz": 225.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.58,
        3.19
      ],
      [
        8.81,
        2.29
      ],
      [
        8.37,
        -4.79
      ],
      [
        -6.02,
        -3.89
      ]
    ]
  },
  {
    "id": "osm_346545749",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 214.9,
    "cz": 101.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.91,
        3.01
      ],
      [
        3.13,
        2.83
      ],
      [
        2.86,
        -4.52
      ],
      [
        -2.17,
        -4.34
      ]
    ]
  },
  {
    "id": "osm_346535010",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -230.7,
    "cz": 56.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -0.97,
        1.78
      ],
      [
        2.31,
        1.02
      ],
      [
        1.45,
        -2.68
      ],
      [
        -1.82,
        -1.92
      ]
    ]
  },
  {
    "id": "osm_346535056",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 29.8,
    "cz": 235.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.28,
        -3.36
      ],
      [
        4.57,
        10.48
      ],
      [
        10.93,
        5.05
      ],
      [
        -0.92,
        -8.79
      ]
    ]
  },
  {
    "id": "osm_346545760",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 148.7,
    "cz": 185.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.21,
        4.05
      ],
      [
        6.47,
        3.89
      ],
      [
        6.29,
        -6.08
      ],
      [
        -4.35,
        -5.92
      ]
    ]
  },
  {
    "id": "osm_346535111",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 103.5,
    "cz": 214.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.91,
        2.89
      ],
      [
        3.22,
        2.63
      ],
      [
        2.86,
        -4.33
      ],
      [
        -2.27,
        -4.06
      ]
    ]
  },
  {
    "id": "osm_346545942",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 231.9,
    "cz": 57.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.63,
        1.69
      ],
      [
        2.36,
        1.78
      ],
      [
        2.45,
        -2.54
      ],
      [
        -1.53,
        -2.63
      ]
    ]
  },
  {
    "id": "osm_346535233",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -189.7,
    "cz": 145.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.03,
        -4.3
      ],
      [
        -2.54,
        9.38
      ],
      [
        9.03,
        6.45
      ],
      [
        5.55,
        -7.24
      ]
    ]
  },
  {
    "id": "osm_346555835",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 101.7,
    "cz": -216.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -8.05,
        11.54
      ],
      [
        -0.74,
        12.0
      ],
      [
        0.22,
        -3.42
      ],
      [
        11.15,
        -2.74
      ],
      [
        11.84,
        -13.9
      ],
      [
        -6.38,
        -15.04
      ]
    ]
  },
  {
    "id": "osm_343430912",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -189.3,
    "cz": -146.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.12,
        3.63
      ],
      [
        9.1,
        -0.22
      ],
      [
        7.69,
        -5.45
      ],
      [
        -6.53,
        -1.61
      ]
    ]
  },
  {
    "id": "osm_346545662",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 136.1,
    "cz": 197.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.13,
        2.87
      ],
      [
        3.53,
        2.59
      ],
      [
        3.22,
        -4.3
      ],
      [
        -2.47,
        -4.02
      ]
    ]
  },
  {
    "id": "osm_346555770",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 124.4,
    "cz": -204.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.08,
        1.89
      ],
      [
        5.4,
        3.03
      ],
      [
        6.11,
        -2.83
      ],
      [
        -3.37,
        -3.96
      ]
    ]
  },
  {
    "id": "osm_346545950",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 200.0,
    "cz": 132.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.42,
        3.59
      ],
      [
        2.44,
        3.46
      ],
      [
        2.13,
        -5.39
      ],
      [
        -1.73,
        -5.27
      ]
    ]
  },
  {
    "id": "osm_346546010",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 187.1,
    "cz": 151.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.36,
        5.08
      ],
      [
        5.23,
        4.73
      ],
      [
        5.01,
        -1.48
      ],
      [
        1.7,
        -1.37
      ],
      [
        1.54,
        -6.13
      ],
      [
        -4.75,
        -5.9
      ]
    ]
  },
  {
    "id": "osm_343448055",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -94.6,
    "cz": -221.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -0.22,
        5.29
      ],
      [
        3.53,
        4.32
      ],
      [
        0.33,
        -7.93
      ],
      [
        -3.42,
        -6.95
      ]
    ]
  },
  {
    "id": "osm_346535177",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 110.3,
    "cz": 214.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.65,
        2.87
      ],
      [
        4.16,
        2.69
      ],
      [
        3.97,
        -4.31
      ],
      [
        -2.84,
        -4.14
      ]
    ]
  },
  {
    "id": "osm_346510786",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -45.5,
    "cz": 237.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.11,
        2.48
      ],
      [
        2.81,
        2.75
      ],
      [
        3.15,
        -3.71
      ],
      [
        -1.75,
        -3.99
      ]
    ]
  },
  {
    "id": "osm_1070105460",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 176.9,
    "cz": -164.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.1,
        -6.3
      ],
      [
        11.01,
        -1.2
      ],
      [
        7.64,
        9.44
      ],
      [
        -8.46,
        4.34
      ]
    ]
  },
  {
    "id": "osm_343434791",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -225.5,
    "cz": -86.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -10.82,
        6.48
      ],
      [
        18.43,
        -0.37
      ],
      [
        16.24,
        -9.72
      ],
      [
        -13.01,
        -2.88
      ]
    ]
  },
  {
    "id": "osm_346510815",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -60.0,
    "cz": 234.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.16,
        2.69
      ],
      [
        5.95,
        3.1
      ],
      [
        6.25,
        -4.04
      ],
      [
        -3.87,
        -4.45
      ]
    ]
  },
  {
    "id": "osm_346510693",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -136.0,
    "cz": 200.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.15,
        1.69
      ],
      [
        4.47,
        2.08
      ],
      [
        4.71,
        -2.52
      ],
      [
        -2.9,
        -2.92
      ]
    ]
  },
  {
    "id": "osm_346534806",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 91.9,
    "cz": 223.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.66,
        2.81
      ],
      [
        2.15,
        2.99
      ],
      [
        2.49,
        -4.22
      ],
      [
        -1.32,
        -4.4
      ]
    ]
  },
  {
    "id": "osm_346510746",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -68.0,
    "cz": 233.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.12,
        3.37
      ],
      [
        2.84,
        3.56
      ],
      [
        3.17,
        -5.06
      ],
      [
        -1.78,
        -5.25
      ]
    ]
  },
  {
    "id": "osm_346535453",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -183.4,
    "cz": 159.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.35,
        3.98
      ],
      [
        6.84,
        1.48
      ],
      [
        5.02,
        -5.97
      ],
      [
        -5.18,
        -3.46
      ]
    ]
  },
  {
    "id": "osm_343434830",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -132.8,
    "cz": -203.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.47,
        7.76
      ],
      [
        7.01,
        5.35
      ],
      [
        2.22,
        -11.63
      ],
      [
        -6.27,
        -9.23
      ]
    ]
  },
  {
    "id": "osm_346534942",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -221.2,
    "cz": 101.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.83,
        2.86
      ],
      [
        6.87,
        0.1
      ],
      [
        5.74,
        -4.28
      ],
      [
        -4.96,
        -1.53
      ]
    ]
  },
  {
    "id": "osm_346510924",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -51.0,
    "cz": 238.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.79,
        4.56
      ],
      [
        2.45,
        4.65
      ],
      [
        2.69,
        -6.83
      ],
      [
        -1.55,
        -6.92
      ]
    ]
  },
  {
    "id": "osm_346545960",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 159.2,
    "cz": 184.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.39,
        3.2
      ],
      [
        3.74,
        3.07
      ],
      [
        3.58,
        -4.81
      ],
      [
        -2.55,
        -4.68
      ]
    ]
  },
  {
    "id": "osm_346510542",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -74.5,
    "cz": 232.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.38,
        2.94
      ],
      [
        3.46,
        3.03
      ],
      [
        3.57,
        -4.42
      ],
      [
        -2.27,
        -4.5
      ]
    ]
  },
  {
    "id": "osm_343430887",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -180.4,
    "cz": -165.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        0.02,
        5.7
      ],
      [
        3.12,
        4.98
      ],
      [
        -0.03,
        -8.55
      ],
      [
        -3.13,
        -7.83
      ]
    ]
  },
  {
    "id": "osm_343434829",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -143.6,
    "cz": -198.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.79,
        8.46
      ],
      [
        8.84,
        5.46
      ],
      [
        4.18,
        -12.7
      ],
      [
        -7.46,
        -9.7
      ]
    ]
  },
  {
    "id": "osm_346545748",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 235.1,
    "cz": 68.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.72,
        3.85
      ],
      [
        5.49,
        3.94
      ],
      [
        5.58,
        -5.79
      ],
      [
        -3.62,
        -5.87
      ]
    ]
  },
  {
    "id": "osm_346535189",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 122.7,
    "cz": 212.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.79,
        2.97
      ],
      [
        4.11,
        3.04
      ],
      [
        4.18,
        -4.45
      ],
      [
        -2.71,
        -4.53
      ]
    ]
  },
  {
    "id": "osm_346535401",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 99.8,
    "cz": 224.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.16,
        3.53
      ],
      [
        6.56,
        3.11
      ],
      [
        6.24,
        -5.29
      ],
      [
        -4.49,
        -4.88
      ]
    ]
  },
  {
    "id": "osm_352222727",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 148.8,
    "cz": 195.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.97,
        3.83
      ],
      [
        6.11,
        3.68
      ],
      [
        5.96,
        -5.74
      ],
      [
        -4.11,
        -5.6
      ]
    ]
  },
  {
    "id": "osm_346545897",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 245.5,
    "cz": 20.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.55,
        4.66
      ],
      [
        5.21,
        4.75
      ],
      [
        5.33,
        -7.0
      ],
      [
        -3.43,
        -7.09
      ]
    ]
  },
  {
    "id": "osm_346545930",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 232.3,
    "cz": 82.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.7,
        2.73
      ],
      [
        2.49,
        2.76
      ],
      [
        2.54,
        -4.08
      ],
      [
        -1.64,
        -4.13
      ]
    ]
  },
  {
    "id": "osm_346510993",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -147.7,
    "cz": 197.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        5.35,
        4.14
      ],
      [
        6.5,
        -9.14
      ],
      [
        -5.69,
        -10.2
      ],
      [
        -6.65,
        0.77
      ],
      [
        -2.86,
        1.1
      ],
      [
        -2.97,
        2.57
      ],
      [
        0.53,
        2.88
      ],
      [
        0.46,
        3.72
      ]
    ]
  },
  {
    "id": "osm_346510880",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -129.1,
    "cz": 210.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.44,
        4.06
      ],
      [
        2.97,
        4.42
      ],
      [
        3.64,
        -6.08
      ],
      [
        -1.72,
        -6.44
      ]
    ]
  },
  {
    "id": "osm_346545803",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 195.3,
    "cz": 151.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.7,
        4.46
      ],
      [
        2.94,
        4.29
      ],
      [
        2.55,
        -6.69
      ],
      [
        -2.09,
        -6.52
      ]
    ]
  },
  {
    "id": "osm_346545851",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 209.1,
    "cz": 131.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.13,
        4.81
      ],
      [
        3.61,
        4.6
      ],
      [
        3.21,
        -7.22
      ],
      [
        -2.57,
        -7.02
      ]
    ]
  },
  {
    "id": "osm_346510796",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -136.8,
    "cz": 205.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.3,
        1.49
      ],
      [
        4.66,
        2.03
      ],
      [
        4.94,
        -2.23
      ],
      [
        -3.02,
        -2.76
      ]
    ]
  },
  {
    "id": "osm_346510738",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -89.7,
    "cz": 230.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.78,
        2.82
      ],
      [
        5.24,
        3.35
      ],
      [
        5.68,
        -4.24
      ],
      [
        -3.34,
        -4.76
      ]
    ]
  },
  {
    "id": "osm_346535381",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -182.2,
    "cz": 167.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.18,
        -2.44
      ],
      [
        -4.09,
        4.42
      ],
      [
        8.79,
        5.92
      ],
      [
        5.64,
        -5.44
      ]
    ]
  },
  {
    "id": "osm_346545741",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 245.4,
    "cz": 35.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.69,
        5.78
      ],
      [
        5.79,
        5.6
      ],
      [
        5.52,
        -8.67
      ],
      [
        -3.95,
        -8.49
      ]
    ]
  },
  {
    "id": "osm_346535602",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 109.5,
    "cz": 223.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.67,
        2.62
      ],
      [
        2.76,
        2.45
      ],
      [
        2.5,
        -3.94
      ],
      [
        -1.92,
        -3.77
      ]
    ]
  },
  {
    "id": "osm_346545927",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 242.3,
    "cz": 55.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.71,
        3.0
      ],
      [
        2.98,
        2.73
      ],
      [
        2.56,
        -4.49
      ],
      [
        -2.13,
        -4.22
      ]
    ]
  },
  {
    "id": "osm_346545788",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 186.9,
    "cz": 164.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.03,
        4.6
      ],
      [
        6.45,
        4.22
      ],
      [
        6.06,
        -6.9
      ],
      [
        -4.43,
        -6.54
      ]
    ]
  },
  {
    "id": "osm_346545660",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 166.2,
    "cz": 185.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.81,
        3.23
      ],
      [
        2.98,
        3.07
      ],
      [
        2.72,
        -4.84
      ],
      [
        -2.06,
        -4.68
      ]
    ]
  },
  {
    "id": "osm_346535440",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 129.6,
    "cz": 212.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.91,
        3.14
      ],
      [
        2.77,
        3.2
      ],
      [
        2.88,
        -4.71
      ],
      [
        -1.81,
        -4.77
      ]
    ]
  },
  {
    "id": "osm_346535735",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -201.3,
    "cz": 147.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.19,
        5.52
      ],
      [
        4.62,
        5.17
      ],
      [
        4.48,
        0.95
      ],
      [
        3.48,
        0.98
      ],
      [
        3.4,
        -1.12
      ],
      [
        1.6,
        -1.07
      ],
      [
        1.37,
        -8.1
      ],
      [
        -6.61,
        -7.84
      ]
    ]
  },
  {
    "id": "osm_346555839",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 203.3,
    "cz": -144.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.79,
        -18.01
      ],
      [
        -11.87,
        3.11
      ],
      [
        -4.17,
        6.06
      ],
      [
        -5.38,
        9.24
      ],
      [
        2.54,
        12.26
      ],
      [
        4.33,
        7.55
      ],
      [
        7.3,
        8.68
      ],
      [
        14.8,
        -10.9
      ]
    ]
  },
  {
    "id": "osm_346535196",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 56.2,
    "cz": 243.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.4,
        2.87
      ],
      [
        2.69,
        2.51
      ],
      [
        2.1,
        -4.29
      ],
      [
        -1.98,
        -3.94
      ]
    ]
  },
  {
    "id": "osm_1070105461",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 179.8,
    "cz": -174.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.58,
        1.85
      ],
      [
        7.82,
        7.28
      ],
      [
        11.38,
        -2.78
      ],
      [
        -4.03,
        -8.21
      ]
    ]
  },
  {
    "id": "osm_346534808",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 61.3,
    "cz": 242.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.73,
        3.33
      ],
      [
        3.26,
        2.91
      ],
      [
        2.59,
        -4.99
      ],
      [
        -2.4,
        -4.56
      ]
    ]
  },
  {
    "id": "osm_1315279199",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -245.6,
    "cz": 49.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.92,
        9.28
      ],
      [
        8.5,
        6.4
      ],
      [
        2.89,
        -13.93
      ],
      [
        -7.54,
        -11.05
      ]
    ]
  },
  {
    "id": "osm_346510717",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -57.8,
    "cz": 244.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.12,
        2.93
      ],
      [
        2.73,
        3.22
      ],
      [
        3.17,
        -4.39
      ],
      [
        -1.68,
        -4.67
      ]
    ]
  },
  {
    "id": "osm_346510590",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -48.5,
    "cz": 246.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.12,
        2.09
      ],
      [
        7.55,
        2.36
      ],
      [
        7.66,
        -3.13
      ],
      [
        -4.99,
        -3.4
      ]
    ]
  },
  {
    "id": "osm_346534793",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 66.9,
    "cz": 242.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.62,
        3.37
      ],
      [
        3.13,
        2.96
      ],
      [
        2.43,
        -5.06
      ],
      [
        -2.31,
        -4.66
      ]
    ]
  },
  {
    "id": "osm_346510811",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -102.3,
    "cz": 229.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.69,
        2.78
      ],
      [
        6.55,
        3.49
      ],
      [
        7.04,
        -4.17
      ],
      [
        -4.21,
        -4.88
      ]
    ]
  },
  {
    "id": "osm_1211325476",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -153.1,
    "cz": -199.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.22,
        -6.56
      ],
      [
        0.32,
        11.37
      ],
      [
        6.34,
        9.84
      ],
      [
        1.8,
        -8.08
      ]
    ]
  },
  {
    "id": "osm_346510550",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -63.1,
    "cz": 243.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.94,
        3.09
      ],
      [
        2.46,
        3.33
      ],
      [
        2.9,
        -4.63
      ],
      [
        -1.49,
        -4.88
      ]
    ]
  },
  {
    "id": "osm_346534838",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 74.3,
    "cz": 240.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.22,
        2.78
      ],
      [
        2.4,
        2.47
      ],
      [
        1.82,
        -4.17
      ],
      [
        -1.79,
        -3.86
      ]
    ]
  },
  {
    "id": "osm_346545693",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 215.1,
    "cz": 131.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.85,
        4.22
      ],
      [
        3.15,
        4.04
      ],
      [
        2.77,
        -6.33
      ],
      [
        -2.23,
        -6.15
      ]
    ]
  },
  {
    "id": "osm_343434828",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -161.4,
    "cz": -193.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.3,
        8.31
      ],
      [
        7.91,
        5.82
      ],
      [
        3.45,
        -12.47
      ],
      [
        -6.75,
        -9.98
      ]
    ]
  },
  {
    "id": "osm_352222739",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 160.9,
    "cz": 194.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.68,
        3.64
      ],
      [
        7.13,
        3.5
      ],
      [
        7.01,
        -5.47
      ],
      [
        -4.8,
        -5.33
      ]
    ]
  },
  {
    "id": "osm_346545841",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 238.7,
    "cz": 82.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.91,
        3.79
      ],
      [
        2.78,
        3.82
      ],
      [
        2.87,
        -5.69
      ],
      [
        -1.82,
        -5.73
      ]
    ]
  },
  {
    "id": "osm_346535513",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 78.2,
    "cz": 240.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.22,
        2.78
      ],
      [
        2.4,
        2.47
      ],
      [
        1.83,
        -4.16
      ],
      [
        -1.78,
        -3.85
      ]
    ]
  },
  {
    "id": "osm_346510710",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -137.7,
    "cz": 212.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.51,
        2.04
      ],
      [
        4.79,
        2.71
      ],
      [
        5.27,
        -3.04
      ],
      [
        -3.03,
        -3.73
      ]
    ]
  },
  {
    "id": "osm_346534892",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 82.1,
    "cz": 239.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.22,
        2.78
      ],
      [
        2.39,
        2.47
      ],
      [
        1.83,
        -4.16
      ],
      [
        -1.79,
        -3.85
      ]
    ]
  },
  {
    "id": "osm_346534826",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -231.1,
    "cz": 104.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        5.01,
        0.77
      ],
      [
        3.83,
        -3.98
      ],
      [
        -7.51,
        -1.15
      ],
      [
        -6.32,
        3.61
      ]
    ]
  },
  {
    "id": "osm_346510765",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -74.1,
    "cz": 242.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.46,
        2.73
      ],
      [
        5.78,
        3.88
      ],
      [
        6.68,
        -4.09
      ],
      [
        -3.55,
        -5.25
      ]
    ]
  },
  {
    "id": "osm_346534848",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 139.9,
    "cz": 211.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.0,
        2.83
      ],
      [
        3.26,
        2.64
      ],
      [
        3.0,
        -4.24
      ],
      [
        -2.26,
        -4.05
      ]
    ]
  },
  {
    "id": "osm_346545890",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 225.0,
    "cz": 118.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.41,
        4.77
      ],
      [
        5.53,
        4.45
      ],
      [
        5.11,
        -7.16
      ],
      [
        -3.84,
        -6.84
      ]
    ]
  },
  {
    "id": "osm_346534819",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -225.7,
    "cz": 116.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.16,
        6.33
      ],
      [
        9.49,
        2.66
      ],
      [
        6.23,
        -9.5
      ],
      [
        -7.42,
        -5.84
      ]
    ]
  },
  {
    "id": "osm_346545840",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 245.2,
    "cz": 67.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.05,
        4.18
      ],
      [
        4.91,
        3.91
      ],
      [
        4.58,
        -6.26
      ],
      [
        -3.38,
        -5.99
      ]
    ]
  },
  {
    "id": "osm_346535399",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 124.0,
    "cz": 222.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.4,
        3.85
      ],
      [
        3.7,
        3.77
      ],
      [
        3.59,
        -5.77
      ],
      [
        -2.5,
        -5.7
      ]
    ]
  },
  {
    "id": "osm_346535473",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 85.9,
    "cz": 239.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.22,
        2.78
      ],
      [
        2.4,
        2.46
      ],
      [
        1.83,
        -4.17
      ],
      [
        -1.79,
        -3.86
      ]
    ]
  },
  {
    "id": "osm_346546001",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 233.8,
    "cz": 100.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.42,
        1.73
      ],
      [
        -0.68,
        1.75
      ],
      [
        -0.69,
        3.53
      ],
      [
        5.75,
        3.6
      ],
      [
        5.84,
        -6.14
      ],
      [
        -3.35,
        -6.23
      ]
    ]
  },
  {
    "id": "osm_343448056",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -99.4,
    "cz": -234.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -0.79,
        4.58
      ],
      [
        3.64,
        3.53
      ],
      [
        1.18,
        -6.86
      ],
      [
        -3.25,
        -5.81
      ]
    ]
  },
  {
    "id": "osm_346534834",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -216.2,
    "cz": 135.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.85,
        3.58
      ],
      [
        11.12,
        1.33
      ],
      [
        10.28,
        -5.36
      ],
      [
        -7.68,
        -3.11
      ]
    ]
  },
  {
    "id": "osm_346545868",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 195.8,
    "cz": 163.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.52,
        3.3
      ],
      [
        2.57,
        3.15
      ],
      [
        2.28,
        -4.94
      ],
      [
        -1.82,
        -4.79
      ]
    ]
  },
  {
    "id": "osm_346545958",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 254.9,
    "cz": 20.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.65,
        4.53
      ],
      [
        3.98,
        4.53
      ],
      [
        3.98,
        -6.8
      ],
      [
        -2.65,
        -6.8
      ]
    ]
  },
  {
    "id": "osm_346534999",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -221.5,
    "cz": 127.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.78,
        3.5
      ],
      [
        5.91,
        2.0
      ],
      [
        3.62,
        -5.72
      ],
      [
        -3.95,
        -3.29
      ]
    ]
  },
  {
    "id": "osm_346545785",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 207.2,
    "cz": 150.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.63,
        5.16
      ],
      [
        7.41,
        4.74
      ],
      [
        6.95,
        -7.75
      ],
      [
        -5.08,
        -7.32
      ]
    ]
  },
  {
    "id": "osm_346535682",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -198.1,
    "cz": 162.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.97,
        4.64
      ],
      [
        4.54,
        5.77
      ],
      [
        5.37,
        -1.97
      ],
      [
        3.28,
        -2.19
      ],
      [
        3.58,
        -4.98
      ],
      [
        -4.84,
        -5.88
      ]
    ]
  },
  {
    "id": "osm_346535486",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 145.5,
    "cz": 211.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.6,
        3.08
      ],
      [
        2.41,
        3.08
      ],
      [
        2.41,
        -4.62
      ],
      [
        -1.6,
        -4.62
      ]
    ]
  },
  {
    "id": "osm_346510594",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -92.1,
    "cz": 240.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.64,
        2.45
      ],
      [
        5.21,
        2.81
      ],
      [
        5.47,
        -3.67
      ],
      [
        -3.38,
        -4.03
      ]
    ]
  },
  {
    "id": "osm_346535470",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -211.3,
    "cz": 147.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.78,
        3.6
      ],
      [
        2.95,
        3.46
      ],
      [
        2.66,
        -5.41
      ],
      [
        -2.07,
        -5.26
      ]
    ]
  },
  {
    "id": "osm_346534912",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 130.2,
    "cz": 222.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.26,
        3.6
      ],
      [
        3.23,
        3.69
      ],
      [
        3.37,
        -5.41
      ],
      [
        -2.1,
        -5.5
      ]
    ]
  },
  {
    "id": "osm_343434789",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -199.7,
    "cz": -163.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.49,
        2.67
      ],
      [
        3.33,
        1.76
      ],
      [
        2.24,
        -4.01
      ],
      [
        -2.58,
        -3.1
      ]
    ]
  },
  {
    "id": "osm_346740087",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 97.1,
    "cz": -240.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.83,
        3.91
      ],
      [
        3.91,
        4.13
      ],
      [
        4.24,
        -5.86
      ],
      [
        -2.49,
        -6.09
      ]
    ]
  },
  {
    "id": "osm_346534883",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 27.1,
    "cz": 258.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.57,
        4.21
      ],
      [
        6.85,
        4.21
      ],
      [
        6.85,
        -6.31
      ],
      [
        -4.57,
        -6.31
      ]
    ]
  },
  {
    "id": "osm_346510593",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -148.9,
    "cz": 212.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.22,
        4.84
      ],
      [
        3.24,
        5.64
      ],
      [
        4.84,
        -7.26
      ],
      [
        -1.63,
        -8.06
      ]
    ]
  },
  {
    "id": "osm_346535289",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 151.4,
    "cz": 211.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.63,
        3.71
      ],
      [
        4.13,
        3.58
      ],
      [
        3.94,
        -5.58
      ],
      [
        -2.82,
        -5.44
      ]
    ]
  },
  {
    "id": "osm_343434802",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -252.5,
    "cz": -60.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.24,
        7.96
      ],
      [
        9.35,
        5.63
      ],
      [
        6.35,
        -11.94
      ],
      [
        -7.24,
        -9.61
      ]
    ]
  },
  {
    "id": "osm_346535706",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 64.2,
    "cz": 252.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -5.17,
        3.75
      ],
      [
        8.45,
        2.58
      ],
      [
        7.75,
        -5.63
      ],
      [
        -5.88,
        -4.46
      ]
    ]
  },
  {
    "id": "osm_346534989",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 102.0,
    "cz": 239.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.06,
        3.55
      ],
      [
        6.38,
        3.2
      ],
      [
        6.09,
        -5.33
      ],
      [
        -4.35,
        -4.97
      ]
    ]
  },
  {
    "id": "osm_346510962",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -103.0,
    "cz": 239.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.2,
        2.69
      ],
      [
        5.98,
        3.13
      ],
      [
        6.3,
        -4.04
      ],
      [
        -3.88,
        -4.48
      ]
    ]
  },
  {
    "id": "osm_346739964",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 183.9,
    "cz": -185.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -9.2,
        1.45
      ],
      [
        9.97,
        8.4
      ],
      [
        13.81,
        -2.18
      ],
      [
        -5.36,
        -9.13
      ]
    ]
  },
  {
    "id": "osm_346545702",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 187.0,
    "cz": 183.4,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.69,
        3.62
      ],
      [
        4.16,
        3.52
      ],
      [
        4.05,
        -5.42
      ],
      [
        -2.82,
        -5.32
      ]
    ]
  },
  {
    "id": "osm_343434833",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -175.8,
    "cz": -194.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.01,
        7.86
      ],
      [
        8.43,
        5.23
      ],
      [
        4.52,
        -11.79
      ],
      [
        -6.93,
        -9.14
      ]
    ]
  },
  {
    "id": "osm_346510543",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -43.8,
    "cz": 258.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.03,
        3.22
      ],
      [
        4.16,
        3.54
      ],
      [
        4.54,
        -4.83
      ],
      [
        -2.66,
        -5.16
      ]
    ]
  },
  {
    "id": "osm_343434788",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -206.1,
    "cz": -162.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        0.12,
        4.98
      ],
      [
        3.2,
        4.08
      ],
      [
        -0.17,
        -7.47
      ],
      [
        -3.25,
        -6.57
      ]
    ]
  },
  {
    "id": "osm_346545998",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 233.7,
    "cz": 120.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.55,
        2.07
      ],
      [
        4.0,
        1.83
      ],
      [
        3.83,
        -3.1
      ],
      [
        -2.73,
        -2.88
      ]
    ]
  },
  {
    "id": "osm_346510983",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -168.7,
    "cz": 201.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.03,
        3.18
      ],
      [
        8.04,
        3.62
      ],
      [
        8.33,
        -4.33
      ],
      [
        -2.13,
        -4.7
      ],
      [
        -2.28,
        -0.45
      ],
      [
        -3.91,
        -0.5
      ]
    ]
  },
  {
    "id": "osm_346535267",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 87.4,
    "cz": 248.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.79,
        -3.4
      ],
      [
        -2.45,
        5.36
      ],
      [
        4.19,
        5.09
      ],
      [
        3.84,
        -3.66
      ]
    ]
  },
  {
    "id": "osm_343430885",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -227.9,
    "cz": -131.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -6.11,
        9.19
      ],
      [
        13.28,
        4.92
      ],
      [
        9.17,
        -13.77
      ],
      [
        -10.21,
        -9.52
      ]
    ]
  },
  {
    "id": "osm_346510878",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -51.0,
    "cz": 258.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.51,
        3.77
      ],
      [
        3.49,
        3.94
      ],
      [
        3.77,
        -5.66
      ],
      [
        -2.23,
        -5.84
      ]
    ]
  },
  {
    "id": "osm_346545827",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 257.8,
    "cz": 53.6,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -7.41,
        2.27
      ],
      [
        11.35,
        1.29
      ],
      [
        11.11,
        -3.4
      ],
      [
        -7.66,
        -2.42
      ]
    ]
  },
  {
    "id": "osm_346534924",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -220.4,
    "cz": 144.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.03,
        -3.87
      ],
      [
        -3.71,
        6.12
      ],
      [
        6.03,
        5.81
      ],
      [
        5.72,
        -4.18
      ]
    ]
  },
  {
    "id": "osm_346545685",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 243.9,
    "cz": 99.9,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.25,
        2.48
      ],
      [
        4.83,
        2.55
      ],
      [
        4.88,
        -3.72
      ],
      [
        -3.2,
        -3.79
      ]
    ]
  },
  {
    "id": "osm_346545936",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 206.9,
    "cz": 163.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.69,
        3.58
      ],
      [
        5.83,
        3.24
      ],
      [
        5.52,
        -5.36
      ],
      [
        -3.99,
        -5.02
      ]
    ]
  },
  {
    "id": "osm_346534938",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -207.8,
    "cz": 162.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.79,
        3.52
      ],
      [
        2.09,
        3.76
      ],
      [
        2.67,
        -5.28
      ],
      [
        -1.2,
        -5.54
      ]
    ]
  },
  {
    "id": "osm_346510916",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -135.2,
    "cz": 226.7,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.88,
        2.87
      ],
      [
        2.7,
        2.94
      ],
      [
        2.81,
        -4.3
      ],
      [
        -1.76,
        -4.36
      ]
    ]
  },
  {
    "id": "osm_346510920",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -113.9,
    "cz": 238.3,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.63,
        2.94
      ],
      [
        5.13,
        3.3
      ],
      [
        5.45,
        -4.4
      ],
      [
        -3.32,
        -4.76
      ]
    ]
  },
  {
    "id": "osm_346534825",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 114.2,
    "cz": 238.2,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.88,
        3.08
      ],
      [
        5.94,
        2.9
      ],
      [
        5.81,
        -4.62
      ],
      [
        -4.01,
        -4.45
      ]
    ]
  },
  {
    "id": "osm_346535549",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -229.4,
    "cz": 131.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.71,
        3.38
      ],
      [
        4.2,
        2.04
      ],
      [
        2.56,
        -5.08
      ],
      [
        -3.33,
        -3.73
      ]
    ]
  },
  {
    "id": "osm_346545928",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 252.6,
    "cz": 81.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.74,
        2.51
      ],
      [
        2.54,
        2.55
      ],
      [
        2.6,
        -3.78
      ],
      [
        -1.67,
        -3.81
      ]
    ]
  },
  {
    "id": "osm_346545849",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 219.0,
    "cz": 149.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.76,
        5.17
      ],
      [
        4.59,
        4.9
      ],
      [
        4.14,
        -7.76
      ],
      [
        -3.22,
        -7.49
      ]
    ]
  },
  {
    "id": "osm_343434835",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -184.3,
    "cz": -191.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -0.81,
        7.56
      ],
      [
        5.34,
        6.11
      ],
      [
        1.21,
        -11.34
      ],
      [
        -4.93,
        -9.88
      ]
    ]
  },
  {
    "id": "osm_346534833",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 162.3,
    "cz": 210.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -4.37,
        3.68
      ],
      [
        6.71,
        3.49
      ],
      [
        6.54,
        -5.53
      ],
      [
        -4.52,
        -5.34
      ]
    ]
  },
  {
    "id": "osm_346545776",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 265.0,
    "cz": 20.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.6,
        4.52
      ],
      [
        5.52,
        4.44
      ],
      [
        5.41,
        -6.79
      ],
      [
        -3.71,
        -6.7
      ]
    ]
  },
  {
    "id": "osm_346545824",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 232.0,
    "cz": 130.0,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.41,
        4.49
      ],
      [
        2.51,
        4.34
      ],
      [
        2.11,
        -6.74
      ],
      [
        -1.81,
        -6.6
      ]
    ]
  },
  {
    "id": "osm_346510801",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": -140.6,
    "cz": 226.1,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -1.67,
        3.05
      ],
      [
        2.38,
        3.11
      ],
      [
        2.5,
        -4.57
      ],
      [
        -1.55,
        -4.62
      ]
    ]
  },
  {
    "id": "osm_346555786",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 204.5,
    "cz": -171.5,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -2.84,
        -6.4
      ],
      [
        -6.97,
        5.8
      ],
      [
        4.26,
        9.6
      ],
      [
        8.39,
        -2.6
      ]
    ]
  },
  {
    "id": "osm_346545707",
    "type": "general",
    "facadeStyle": "commercial_grid",
    "color": "#3f3f46",
    "cx": 265.1,
    "cz": 33.8,
    "height": 16.0,
    "levels": 4,
    "pts": [
      [
        -3.82,
        4.14
      ],
      [
        5.64,
        4.23
      ],
      [
        5.74,
        -6.21
      ],
      [
        -3.73,
        -6.3
      ]
    ]
  }
];
