'use strict';

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/repokemon.json'));
const Spritesmith = require('spritesmith');

const ratio = 2.15;

// Generate our spritesheet
var sprites = data.map(function(d){ return 'data/images/' + d.id + '.png'; });
var spritesmith = new Spritesmith();
Spritesmith.run({
  src: sprites,
  padding: 0,
}, function handleResult (err, result) {
  fs.writeFileSync('data/pokemon-test.png', result.image);
  const width = result.properties.width;
  const height = result.properties.height;
  const css = Object.keys(result.coordinates).map(function(path){
    const id = path.match(/\d+/);
    const coords = result.coordinates[path];
    return '.img-' + id + '{background-position: '
      + '-' + (coords.x/ratio) + 'px '
      + '-' + (coords.y/ratio) + 'px;'
      + '}';
  }).join('\n');
  fs.writeFileSync('pokemon.css', css);
  console.log('True dimensions: ' + width + ' ' + height);
  console.log('CSS dimensions: ' + (width/ratio) + ' ' + (height/ratio));
});
