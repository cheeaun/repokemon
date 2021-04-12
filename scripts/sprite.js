'use strict';

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/repokemon.json'));
const Spritesmith = require('spritesmith');
const jimp = require('jimp');
const tinify = require('tinify');
tinify.key = 'qrCg9SGlTv3bay4knKoslDmK98jAV_qY'; // I know. I'm lazy. Please be nice.

const ratio = 2.15;
const chunkSize = 100;
const dataChunks = Array(Math.ceil(data.length / chunkSize));
const dataLen = data.length;
var index = 0;
var resIndex = 0;
while (index < dataLen) {
  dataChunks[resIndex++] = data.slice(index, (index += chunkSize));
}

// Generate our spritesheet
const dataPromises = dataChunks.map(function (chunk, chunkID) {
  return new Promise(function (resolve, reject) {
    var sprites = chunk.map((d) => `data/images/${d.id}.png`);
    console.log('Spriting chunk ' + chunkID);
    Spritesmith.run(
      {
        src: sprites,
        padding: 0,
      },
      function handleResult(err, result) {
        const path = 'data/pokemon-' + chunkID + '.jpg';
        console.log('Generating: ' + path);
        jimp.read(result.image, (err, image) => {
          image
            .background(0xffffffff)
            .quality(40)
            .getBuffer(jimp.MIME_JPEG, (e, buffer) => {
              tinify
                .fromBuffer(buffer)
                .toFile(path)
                .then(() => {
                  console.log('Generated: ' + path);
                });
            });
        });

        const width = result.properties.width;
        const height = result.properties.height;
        const coords = Object.keys(result.coordinates);
        // const lastCoordID = coords[coords.length - 1].match(/\d+/);
        const notSelector = chunkID ? ':not(.i' + chunkID * 100 + ')' : '';
        let selector = `[class*=i${chunkID}]${notSelector},.i${
          (chunkID + 1) * 100
        }`;
        const css = `${selector}{
          background-image: url(${path.replace('.png', '.jpg')});
          background-size: ${width / ratio}px ${height / ratio}px;
        }
        ${coords
          .map(function (path) {
            const id = path.match(/\d+/);
            const coords = result.coordinates[path];
            return `.i${id}{background-position: -${coords.x / ratio}px -${coords.y / ratio}px;}`;
          })
          .join('\n')}`;
        resolve(css);
      },
    );
  });
});

Promise.all(dataPromises).then(function (results) {
  const path = 'pokemon.css';
  fs.writeFileSync(path, results.join('\n'));
  console.log('Generated: ' + path);
});
