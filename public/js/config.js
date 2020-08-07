const API_KEY = 'AIzaSyCuOlyB9ftUJiC-Qd6f2_QxvToT99TS--4';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const Colors = {
    'AMEX-Bonvoy'   : { red: 0.275, green: 0.741, blue: 0.776 },
    'AMEX-Blue'     : { red: 0.29,  green: 0.525, blue: 0.91  },
    'AMEX_ABP (5%)' : { red: 0.706, green: 0.655, blue: 0.839 },
    'P-3783'        : { red: 0.624, green: 0.773, blue: 0.91  },
    'BB-3588'       : { red: 0.825, green: 0.651, blue: 0.741 },
    'AMEX-Personal' : { red: 0.749, green: 0.565, blue: 0.0   },
    'AMZ Credit'    : { red: 0.945, green: 0.761, blue: 0.196 },
    'CHASE'         : { red: 0.976, green: 0.796, blue: 0.612 },
    'Capital One'   : { red: 0.867, green: 0.494, blue: 0.42  },
    'HD Gift Card'  : { red: 1.0,   green: 0.6,   blue: 0.0   },
    'Merrick'       : { red: 0.576, green: 0.769, blue: 0.49  },
    'Citizens'      : { red: 0.463, green: 0.647, blue: 0.686 },
    'WF-3994'       : { red: 1.0,   green: 0.949, blue: 0.8   },
    'AMEX-CHRIS'    : { red: 0.0,   green: 1.0,   blue: 0.0   },
    'profit'        : { red: 0.714, green: 0.843, blue: 0.659 },
    'roiFontColor'  : { red: 0.22,  green: 0.463, blue: 0.114 },
    'default'       : { red: 1.0,   green: 0.949, blue: 0.8   }
}