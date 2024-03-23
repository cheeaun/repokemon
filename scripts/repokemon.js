require("dotenv").config();
const fs = require("fs");
const { join } = require("path");
const { Readable } = require("stream");
const Spritesmith = require("spritesmith");
const jimp = require("jimp");
const tinify = require("tinify");
tinify.key = "qrCg9SGlTv3bay4knKoslDmK98jAV_qY"; // I know. I'm lazy. Please be nice.

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const removeUnsearchableChars = (str) => str.replace(/[^A-zÀ-ú0-9 .\-_:]/gi, "");

const DEFAULT_LANG = "us";
class Repokemon {
    constructor(USER) {
        this.USER = USER;
    }

    async fetchOneRePokemon(onePokemon, retry = 1) {
        const pokemonName = onePokemon.name;
        const pokemonSlug = onePokemon.slug;

        console.log(onePokemon.id + " Catching " + pokemonName + ` (${retry})` + "...");
        const url = `https://api.github.com/search/repositories?per_page=100&q=${encodeURIComponent(
            `${removeUnsearchableChars(pokemonName)} mirror:false`
        )}`;
        const response = await fetch(url, {
            headers: {
                Authorization: this.USER ? `Basic ${Buffer.from(this.USER).toString("base64")}` : undefined,
                // "User-Agent": "Repokemon client",
            },
        });
        if (!response.ok) {
            const sec = 5 * retry;
            console.error(`Error: ${response.status} - ${response.statusText}. Retrying in ${sec} seconds...`);
            await sleep(sec * 1000);
            return await this.fetchOneRePokemon(onePokemon, retry + 1);
        }
        const data = await response.json();
        const allItems = data.items;
        if (allItems?.length) {
            const items = allItems.filter(function (item) {
                return (
                    item.description &&
                    item.language &&
                    (item.name.toLowerCase() == pokemonName.toLowerCase() ||
                        item.name.toLowerCase() == removeUnsearchableChars(pokemonName.toLowerCase()) ||
                        item.name.toLowerCase() == pokemonSlug.toLowerCase() ||
                        item.name.toLowerCase() == pokemonSlug.toLowerCase().replace(/_/g, "-") ||
                        item.name.toLowerCase() == pokemonSlug.toLowerCase().replace(/_/g, ""))
                );
            });
            const item = items.sort(function (a, b) {
                const s = b.stargazers_count - a.stargazers_count;
                if (s != 0) return s;
                return new Date(b.pushed_at) - new Date(a.pushed_at);
            })[0];
            if (item) {
                return {
                    id: item.id,
                    name: item.name,
                    full_name: item.full_name,
                    owner_name: item.owner.login,
                    owner_avatar: item.owner.avatar_url,
                    url: item.html_url,
                    desc: item.description,
                    lang: item.language,
                    stars: item.stargazers_count,
                    watches: item.watchers_count,
                    forks: item.forks_count,
                };
            }
        }
    }

    async getPokemonList(lang) {
        const pathToPokemonList = join("data", "langs", lang);
        const json = JSON.parse(fs.readFileSync(join(pathToPokemonList, "pokemon-list.json")));
        const ids = [];
        const dupIDs = new Set();
        const data = json
            .filter(function (d) {
                // Filter out duplicates
                const id = d.id;
                const included = ids.indexOf(id) >= 0;
                if (included) dupIDs.add(id);
                if (!included) ids.push(id);
                return !included;
            })
            .map(function (d) {
                return {
                    // 3 digits for ID, padded with zeros
                    // But one day, they have 1K pokemons so it became 4 digits
                    // Suddenly d.number returns "0001" instead of "001" but the image is still 001.png
                    id: String(d.id).padStart(3, 0),
                    name: d.name,
                    slug: d.slug,
                };
            });

        console.log(`Duplicate IDs in source data`, [...dupIDs]);
        const total = data.length;
        console.log("Total pokemons: " + total);

        console.log(`Estimated catching time: ${Math.ceil(total / 30)} minute(s)`);
        const poolSize = 10;
        for (let indexPool = 0; indexPool < total; indexPool += poolSize) {
            const tensPromises = data
                .slice(indexPool, indexPool + poolSize)
                .map((onePokemon) => this.fetchOneRePokemon(onePokemon));
            const results = await Promise.all(tensPromises);
            results.forEach(function (result, index) {
                data[indexPool + index].repo = result;
            });
        }
        fs.writeFileSync(join(pathToPokemonList, "repokemon.json"), JSON.stringify(data, null, "\t"));
        fs.writeFileSync(join(pathToPokemonList, "last-updated.txt"), new Date().toJSON());
    }
    getStats(lang) {
        const pathToPokemonList = join("data", "langs", lang);
        const data = JSON.parse(fs.readFileSync(join(pathToPokemonList, "repokemon.json")));

        const weirdNames = data.filter((d) => !/^[A-zÀ-ú0-9 .\-_:]+$/i.test(d.name)).map((d) => d.name);

        console.log("Unsearchable names: " + weirdNames.join(", "));

        let countAvailable = 0;
        let countUnavailable = 0;
        data.forEach(function (d) {
            d.repo ? countUnavailable++ : countAvailable++;
        });

        console.log("Total unavailable pokemon names (taken): " + countUnavailable);
        console.log("Total available pokemon names (not taken): " + countAvailable);

        const topStarredRepos = data
            .filter(function (d) {
                return !!d.repo;
            })
            .sort(function (a, b) {
                return b.repo.stars - a.repo.stars;
            })
            .map(function (d, i) {
                return " " + (i + 1) + ". " + d.repo.full_name + " ⭐️ " + d.repo.stars;
            })
            .slice(0, 10)
            .join("\n");

        console.log("Most starred repos:");
        console.log(topStarredRepos);

        const topForkedRepos = data
            .filter(function (d) {
                return !!d.repo;
            })
            .sort(function (a, b) {
                return b.repo.forks - a.repo.forks;
            })
            .map(function (d, i) {
                return " " + (i + 1) + ". " + d.repo.full_name + " 🍴 " + d.repo.forks;
            })
            .slice(0, 10)
            .join("\n");

        console.log("Most forked repos:");
        console.log(topForkedRepos);
    }
    async createCSS() {
        const data = JSON.parse(fs.readFileSync(`data/langs/${DEFAULT_LANG}/repokemon.json`));
        const ratio = 2.15;
        const chunkSize = 100;
        const dataChunks = Array(Math.ceil(data.length / chunkSize));
        const dataLen = data.length;
        let index = 0;
        let resIndex = 0;
        while (index < dataLen) {
            dataChunks[resIndex++] = data.slice(index, (index += chunkSize));
        }

        // Generate our spritesheet
        const dataPromises = dataChunks.map(function (chunk, chunkID) {
            return new Promise(function (resolve, reject) {
                const sprites = chunk.map((d) => `data/images/${d.id}.png`);
                console.log("Spriting chunk " + chunkID);
                Spritesmith.run(
                    {
                        src: sprites,
                        padding: 0,
                    },
                    function handleResult(err, result) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        const path = "data/imgs/pokemon-" + chunkID + ".jpg";
                        console.log("Generating: " + path);
                        jimp.read(result.image, (err, image) => {
                            image
                                .background(0xffffffff)
                                .quality(40)
                                .getBuffer(jimp.MIME_JPEG, (e, buffer) => {
                                    tinify
                                        .fromBuffer(buffer)
                                        .toFile(path)
                                        .then(() => {
                                            console.log("Generated: " + path);
                                        });
                                });
                        });

                        const width = result.properties.width;
                        const height = result.properties.height;
                        const coords = Object.keys(result.coordinates);
                        const notSelector = chunkID ? ":not(.i" + chunkID * 100 + ")" : "";
                        let selector = `[class*=i${chunkID}]${notSelector},.i${(chunkID + 1) * 100}`;
                        const css = `${selector}{
          background-image: url(${path.replace(".png", ".jpg")});
          background-size: ${width / ratio}px ${height / ratio}px;
        }
        ${coords
            .map((path) => {
                const id = path.match(/\d+/);
                const coords = result.coordinates[path];
                return `.i${id}{background-position: -${coords.x / ratio}px -${coords.y / ratio}px;}`;
            })
            .join("\n")}`;
                        resolve(css);
                    }
                );
            });
        });

        await Promise.all(dataPromises).then(function (results) {
            const path = "pokemon.css";
            fs.writeFileSync(path, results.join("\n"));
            console.log("Generated: " + path);
        });
    }
    async getImages() {
        if (!fs.existsSync("data/images")) fs.mkdirSync("data/images");

        const data = JSON.parse(fs.readFileSync(`data/langs/${DEFAULT_LANG}/repokemon.json`));

        let i = 0;
        const length = data.length;

        const downloadFile = async function (d) {
            if (i >= length) return;
            const id = d.id;
            if (!fs.existsSync("data/images/" + id + ".png")) {
                console.log("GET assets.pokemon.com/assets/cms2/img/pokedex/detail/" + id + ".png");
                const response = await fetch(
                    "https://assets.pokemon.com/assets/cms2/img/pokedex/detail/" + id + ".png"
                );
                const path = "data/images/" + id + ".png";
                const writeStream = fs.createWriteStream(path);
                await Readable.fromWeb(response.body).pipe(writeStream);
            }
        };
        const poolSize = 10;
        for (let indexPool = 0; indexPool < data.length; indexPool += poolSize) {
            const tensPromises = data
                .slice(indexPool, indexPool + poolSize)
                .map((onePokemon) => downloadFile(onePokemon));
            await Promise.all(tensPromises);
        }
    }
    minimizeJSON(lang) {
        const pathToPokemonList = join("data", "langs", lang);
        const data = JSON.parse(fs.readFileSync(join(pathToPokemonList, "repokemon.json")));
        const minData = data.map(function (d) {
            const newD = {
                id: d.id,
                name: d.name,
            };
            if (d.repo?.desc && d.repo.lang) {
                newD.repo = {
                    full_name: d.repo.full_name,
                    desc: d.repo.desc,
                    stars: d.repo.stars,
                    forks: d.repo.forks,
                };
            }
            return newD;
        });
        fs.writeFileSync(join(pathToPokemonList, "repokemon.min.json"), JSON.stringify(minData));
    }
}

const main = async () => {
    const { GH_CLIENT_ID, GH_CLIENT_SECRET } = process.env;
    const USER = `${GH_CLIENT_ID}:${GH_CLIENT_SECRET}`;
    const repokemon = new Repokemon(USER);
    await repokemon.getImages();
    await repokemon.createCSS();
    const langs = fs.readdirSync("data/langs");
    for (const oneLang of langs) {
        console.log(`Processing ${oneLang}...`);
        await repokemon.getPokemonList(oneLang);
        repokemon.minimizeJSON(oneLang);
        repokemon.getStats(oneLang);
    }
};

if (require.main === module) {
    main();
}
