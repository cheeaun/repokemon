Repokémon
===

Showcase of GitHub repos with Pokémon names.

[![Screenshot](screenshot.png)](https://cheeaun.github.io/repokemon/)

How?
---

1. Scrape a list of all pokémons.
2. Use GitHub API and search for every pokémon name.
3. Get a matching repository name with highest number of stars.
4. 💥💥💥

Criteria
---

The showcase only list repositories with these criteria:

- **Repository name** matches exactly the same as Pokémon name.
  - ✅ `name/pikachu`
  - ✅ `name/mr-mime`
  - ✅ `name/mr_mime`
  - ⛔️ `name/pikachu-awesome`
  - ⛔️ `name/pikachuuuu`
- **Most stars**. If there are few repositories with the same name, the one with most stars will be listed.
- **Contains description**, because... it has to be descriptive.
- **Contains `lang`**, the repository language determined by GitHub.

Dev
---

- `yarn` - install dependencies
- `yarn run pokemon` - grab the pokémons
- `yarn run repokemon` - grab the Github repos
  - Copy `config.sample.json` to `config.json`, configure it with `client_id` and `client_secret` from GitHub
  - Takes about 30 minutes to prevent API rate limit issues
- `yarn run min-repokemon` - generate a *minified* version of `data/repokemon.json`, containing only the data that is rendered
- `yarn run stats` - show stats of the collected data
- `yarn run images` - download all pokémon images to `data/images` (not included in this repo)
- `yarn run sprite` - generate a sprite image `data/pokemon-*.png` (not included in this repo), which I manually convert to `data/pokemon-*.jpg`
- `yarn run css-min` - compress `pokemon.css` to smaller `pokemon.min.css`
- `yarn run server` - start a local server at `localhost:1337`

Credits
---

Pokémon data and images are extracted from the [official Pokédex web site](http://www.pokemon.com/us/pokedex/). All Pokémon content is © Nintendo, Game Freak, and The Pokémon Company.

Repokémon is not affiliated with GitHub, Nintendo, Game Freak, or The Pokémon Company in any way.

The logo is created by [@limhenry](https://github.com/limhenry). Available on [Codepen](http://codepen.io/limhenry/full/rLYkWY/).
