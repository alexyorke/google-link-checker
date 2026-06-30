const fs = require('fs');
const os = require('os');
const path = require('path');

function getStorePath() {
    return process.env.GOOGLE_LINK_CHECKER_TEAM_STORE || path.join(os.tmpdir(), 'google-link-checker-teams.json');
}

function readStore() {
    try {
        return JSON.parse(fs.readFileSync(getStorePath(), 'utf8'));
    } catch (err) {
        if (err.code === 'ENOENT') {
            return {};
        }

        throw err;
    }
}

function writeStore(store) {
    var storePath = getStorePath();
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
}

function saveTeam(team) {
    var store = readStore();
    store[team.id] = team;
    writeStore(store);
    return team;
}

function getTeam(teamId) {
    var store = readStore();
    return store[teamId] || null;
}

module.exports = {
    getStorePath: getStorePath,
    getTeam: getTeam,
    saveTeam: saveTeam,
};
