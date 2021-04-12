const { execSync } = require('child_process');
const data = JSON.parse(
  execSync('git show $(git branch --show-current):data/repokemon.json', {
    encoding: 'utf8',
  }),
);
const newData = require('../data/repokemon.json');

const newPokemons = [];
const added = [];
const removed = [];
const changed = [];

newData.forEach((nd) => {
  const d = data.find((p) => nd.id === p.id);
  if (!d) {
    newPokemons.push(nd.name);
  } else if (!d.repo && nd.repo) {
    added.push(nd.repo.full_name);
  } else if (d.repo && !nd.repo) {
    removed.push(d.repo.full_name);
  } else if (d.repo?.id !== nd.repo?.id) {
    changed.push([d.repo.full_name, nd.repo.full_name]);
  }
});

console.log(`New pokemons: ${newPokemons.length}${newPokemons
  .map((d) => `\n  - ${d}`)
  .join('')}

Added: ${added.length}${added.map((d) => `\n  - ${d}`).join('')}

Removed: ${removed.length}${removed.map((d) => `\n  - ${d}`).join('')}

Changed: ${changed.length}${changed
  .map((d) => `\n  - ${d[0]} → ${d[1]}`)
  .join('')}`);
