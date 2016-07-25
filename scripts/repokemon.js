'use strict';

const fs = require('fs');
const https = require('https');
const config = require('./config');

const json = JSON.parse(fs.readFileSync('data/pokemon-list.json'));
const ids = [];
const data = json.filter(function(d){
  // Filter out duplicates
  const id = d.id;
  const included = ids.indexOf(id) >= 0;
  if (!included) ids.push(id);
  return !included;
}).map(function(d){
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
  };
});

let count = 0;
const total = data.length;
console.log('Total pokemons: ' + total);

const done = function(){
  fs.writeFile('data/repokemon.json', JSON.stringify(data, null, '\t'));
};

const fetch = function(){
  if (count >= total) return done();

  var d = data[count++];
  var pokemonName = d.name;
  var pokemonSlug = d.slug;

  console.log(count + ' Fetching... ' + pokemonName);
  https.get({
    hostname: 'api.github.com',
    path: '/search/repositories?q=' + encodeURIComponent(pokemonName) + '&sort=stars&client_id=' + config.client_id + '&client_secret=' + config.client_secret,
    headers: {
      'User-Agent': 'Repokemon client',
    }
  }, function(res){
    var body = '';
    res.on('data', function(chunk){
      body += chunk;
    });
    res.on('end', function(){
      var data = JSON.parse(body);
      if (data.items && data.items.length){
        for (var i=0, l=data.items.length; i<l; i++){
          var item = data.items[i];
          if (item.name.toLowerCase() == pokemonName.toLowerCase() ||
            item.name.toLowerCase() == pokemonSlug.toLowerCase() ||
            item.name.toLowerCase() == pokemonSlug.toLowerCase().replace(/_/g, '-') ||
            item.name.toLowerCase() == pokemonSlug.toLowerCase().replace(/_/g, '')){
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
              setTimeout(fetch, 2000); // 2 seconds interval
              return;
          }
        }
        setTimeout(fetch, 2000); // 2 seconds interval
      } else {
        setTimeout(fetch, 2000); // 2 seconds interval
      }
    });
  });
};

fetch();
