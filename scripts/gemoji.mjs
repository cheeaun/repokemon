import fs from "fs";
import { nameToEmoji } from "gemoji";

const langs = fs.readdirSync("data/langs");
for (const oneLang of langs) {
    console.log(`Processing ${oneLang}...`);

    let index = 1;
    const data = JSON.parse(fs.readFileSync(`data/langs/${oneLang}/repokemon.json`));
    data.forEach(({ repo }) => {
        if (repo && repo.desc && /:[^\s:]+:/.test(repo.desc)) {
            const exp = /([^:]*)(:[^\s:]+:)([^:]*)/g;
            const desc = repo.desc.replace(exp, (match, text1, emojicode, text2) => {
                const emoji = nameToEmoji[emojicode.slice(1, -1)];
                return text1 + emoji + text2;
            });
            console.log(index++ + ". [" + repo.full_name + "] " + desc);
            repo.desc = desc; // Mutate back
        }
    });

    fs.writeFileSync(`data/langs/${oneLang}/repokemon.json`, JSON.stringify(data, null, "\t"));
}
