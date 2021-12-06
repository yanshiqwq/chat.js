const utils = require('../api/utils');
eval(utils.console.setup);

const sqlite = require('better-sqlite3');
const path = require('path');

var dbPath = path.join(__dirname, "../test.db");
const db = sqlite(dbPath);
