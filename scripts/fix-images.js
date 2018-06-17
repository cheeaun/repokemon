const jimp = require('jimp');
const fs = require('fs');

fs.readdir('data/images', (e, files) => {
  files.forEach(f => {
    if (!/\.png$/i.test(f)) return;
    jimp.read(`data/images/${f}`, (err, image) => {
      if (image.bitmap.width !== 215 || image.bitmap.height !== 215){
        console.log(`Dimension for image ${f} is not 215. It'll be resized.`);
        image.autocrop().contain(215, 215).write(`data/images/${f}`);
      }
    });
  });
});