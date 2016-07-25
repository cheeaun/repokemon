'use strict';

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/repokemon.json'));
const minData = data.map(function(d){
  const newD = {
    id: d.id,
    name: d.name,
  };
  if (d.repo && d.repo.desc && d.repo.lang){
    newD.repo = {
      full_name: d.repo.full_name,
      desc: d.repo.desc,
      stars: d.repo.stars,
      forks: d.repo.forks,
    };
  }
  return newD;
});

fs.writeFileSync('data/repokemon.min.json', JSON.stringify(minData));
