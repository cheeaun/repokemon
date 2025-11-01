#!/usr/bin/env bash
# Load environment variables from .env file
if [ -f .env ]; then
    source .env
fi
# Use Scrapfly to scrape because pokemon.com has anti-scraping measures
# Kinda weird even though this repo only fetch once a month
# Temporary quick solution for now
curl -G \
--request "GET" \
--url "https://api.scrapfly.io/scrape" \
--data-urlencode "tags=player,project:default" \
--data-urlencode "asp=true" \
--data-urlencode "render_js=true" \
--data-urlencode "key=${SCRAPFLY_API_KEY}" \
--data-urlencode "url=https://www.pokemon.com/us/api/pokedex/kalos"