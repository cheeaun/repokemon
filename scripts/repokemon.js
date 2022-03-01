require('dotenv').config();
const fs = require('fs');
const https = require('https');

const { GH_CLIENT_ID, GH_CLIENT_SECRET } = process.env;

const json = JSON.parse(fs.readFileSync('data/pokemon-list.json'));
const ids = [];
const dupIDs = new Set();
const data = json
  .filter(function (d) {
    // Filter out duplicates
    const id = d.id;
    const included = ids.indexOf(id) >= 0;
    if (included) dupIDs.add(id);
    if (!included) ids.push(id);
    return !included;
  })
  .map(function (d) {
    return {
      id: d.number, // id = 1, number = '001'
      name: d.name,
      slug: d.slug,
    };
  });

console.log(`Duplicate IDs in source data`, [...dupIDs]);

let count = 0;
const total = data.length;
console.log('Total pokemons: ' + total);

const done = function () {
  fs.writeFileSync('data/repokemon.json', JSON.stringify(data, null, '\t'));
  fs.writeFileSync('data/last-updated.txt', new Date().toJSON());
};

const removeUnsearchableChars = (str) =>
  str.replace(/[^A-zÀ-ú0-9 .\-_:]/gi, '');

const fetch = function () {
  if (count >= total) return done();

  var d = data[count++];
  var pokemonName = d.name;
  var pokemonSlug = d.slug;

  console.log(count + ' Catching ' + pokemonName + '...');
  https.get(
    `https://api.github.com/search/repositories?per_page=100&q=${encodeURIComponent(
      `${removeUnsearchableChars(pokemonName)} mirror:false`,
    )}`,
    {
      auth: `${GH_CLIENT_ID}:${GH_CLIENT_SECRET}`,
      headers: {
        'User-Agent': 'Repokemon client',
      },
    },
    function (res) {
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function () {
        var data = JSON.parse(body);
        var items = data.items;
        if (items && items.length) {
          items = items.filter(function (item) {
            return (
              item.description &&
              item.language &&
              (item.name.toLowerCase() == pokemonName.toLowerCase() ||
                item.name.toLowerCase() ==
                  removeUnsearchableChars(pokemonName.toLowerCase()) ||
                item.name.toLowerCase() == pokemonSlug.toLowerCase() ||
                item.name.toLowerCase() ==
                  pokemonSlug.toLowerCase().replace(/_/g, '-') ||
                item.name.toLowerCase() ==
                  pokemonSlug.toLowerCase().replace(/_/g, ''))
            );
          });
          if (!items.length) {
            setTimeout(fetch, 2000); // 2 seconds interval
            return;
          }
          var item = items.sort(function (a, b) {
            var s = b.stargazers_count - a.stargazers_count;
            if (s != 0) return s;
            return new Date(b.pushed_at) - new Date(a.pushed_at);
          })[0];
          d.repo = {
            id: item.id,
            name: item.name,
            full_name: item.full_name,
            owner_name: item.owner.login,
            owner_avatar: item.owner.avatar_url,
            url: item.html_url,
            desc: item.description,
            lang: item.language,
            stars: item.stargazers_count,
            watches: item.watchers_count,
            forks: item.forks_count,
          };
        }
        setTimeout(fetch, 2000); // 2 seconds interval
      });
    },
  );
};

console.log(`Estimated catching time: ${Math.ceil(total / 30)} minute(s)`);
fetch();
