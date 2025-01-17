import fs from "fs";
import { execSync } from "child_process";

const langs = fs.readdirSync("data/langs");
for (const oneLang of langs) {
    console.log(`Processing ${oneLang}...`);
    const data = JSON.parse(
        execSync(`git show $(git branch --show-current):data/langs/${oneLang}/repokemon.json`, {
            encoding: "utf8",
        })
    );
    const newData = JSON.parse(fs.readFileSync(`data/langs/${oneLang}/repokemon.json`).toString());

    const newPokemons = [];
    const added = [];
    const removed = [];
    const changed = [];

    newData.forEach((nd) => {
        const d = data.find((p) => nd.id === p.id);
        if (!d) {
            newPokemons.push(nd.name);
        } else if (!d.repo && nd.repo) {
            added.push(nd.repo.full_name);
        } else if (d.repo && !nd.repo) {
            removed.push(d.repo.full_name);
        } else if (d.repo?.id !== nd.repo?.id) {
            changed.push([d.repo.full_name, nd.repo.full_name]);
        }
    });

    // Means only stars/fork counts changed. Or descriptions.
    const nothingChanged = !newPokemons.length && !added.length && !removed.length && !changed.length;

    console.log(
        "# " +
            new Date().toUTCString() +
            (nothingChanged
                ? "\n\nNothing changed"
                : (newPokemons.length
                      ? `\n\n## New pokemons: ${newPokemons.length}\n${newPokemons.map((d) => `\n- ${d}`).join("")}`
                      : "") +
                  (added.length ? `\n\n## Added: ${added.length}\n${added.map((d) => `\n- ${d}`).join("")}` : "") +
                  (removed.length
                      ? `\n\n## Removed: ${removed.length}\n${removed.map((d) => `\n- ${d}`).join("")}`
                      : "") +
                  (changed.length
                      ? `\n\n## Changed: ${changed.length}\n${changed.map((d) => `\n- ${d[0]} → ${d[1]}`).join("")}`
                      : ""))
    );
}
