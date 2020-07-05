const fs = require('fs');
const toEmoji = require('gemoji/name-to-emoji');

let index = 1;
const data = JSON.parse(fs.readFileSync('data/repokemon.json'));
data.forEach(({repo}) => {
  if (repo && repo.desc && /:[^\s:]+:/.test(repo.desc)){
    const exp = /([^:]*)(:[^\s:]+:)([^:]*)/g;
    const desc = repo.desc.replace(exp, (match, text1, emojicode, text2) => {
      const emoji = toEmoji[emojicode.slice(1, -1)];
      return text1 + emoji + text2;
    });
    console.log(index++ + '. [' + repo.full_name + '] ' + desc);
    repo.desc = desc; // Mutate back
  }
});

fs.writeFileSync('data/repokemon.json', JSON.stringify(data, null, '\t'));
