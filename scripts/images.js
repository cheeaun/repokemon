'use strict';

const fs = require('fs');
const http = require('http');

if (!fs.existsSync('data/images')) fs.mkdirSync('data/images');

const data = JSON.parse(fs.readFileSync('data/pokemon-list.json'));

let i = 0;
const length = data.length;

const download = function(d){
  if (i >= length) return;
  const id = pad(d.id, 3);
  if (fs.existsSync('data/images/' + id + '.png')){
    download(data[++i]);
  } else {
    console.log('GET assets.pokemon.com/assets/cms2/img/pokedex/detail/' + id + '.png');
    http.get({
      hostname: 'assets.pokemon.com',
      path: '/assets/cms2/img/pokedex/detail/' + id + '.png',
    }, function(res){
      var body = '';
      res.setEncoding('binary');
      res.on('data', function(chunk){
        body += chunk;
      });
      res.on('end', function(){
        fs.writeFile('data/images/' + id + '.png', body, 'binary');
        download(data[++i]);
      });
    });
  }
};

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

download(data[i]);
