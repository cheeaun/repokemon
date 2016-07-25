'use strict';

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/repokemon.min.json'));

let countAvailable = 0;
let countUnavailable = 0;
data.forEach(function(d){
  d.repo ? countUnavailable++ : countAvailable++;
});

console.log('Total unavailable pokemon names (taken): ' + countUnavailable);
console.log('Total available pokemon names (not taken): ' + countAvailable);

const topStarredRepos = data
  .filter(function(d){
    return !!d.repo;
  })
  .sort(function(a, b){
    return b.repo.stars - a.repo.stars;
  })
  .map(function(d, i){
    return ' ' + (i+1) + '. ' + d.repo.full_name + ' ⭐️ ' + d.repo.stars;
  })
  .slice(0, 10)
  .join('\n');

console.log('Most starred repos:');
console.log(topStarredRepos);

const topForkedRepos = data
  .filter(function(d){
    return !!d.repo;
  })
  .sort(function(a, b){
    return b.repo.forks - a.repo.forks;
  })
  .map(function(d, i){
    return ' ' + (i+1) + '. ' + d.repo.full_name + ' 🍴 ' + d.repo.forks;
  })
  .slice(0, 10)
  .join('\n');

console.log('Most forked repos:');
console.log(topForkedRepos);
