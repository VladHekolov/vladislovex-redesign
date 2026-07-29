#!/usr/bin/env sh
set -eu

rm -rf dist
mkdir -p dist

cp -R \
  index.html \
  assets \
  artists \
  repertoire \
  favicon.svg \
  robots.txt \
  sitemap.xml \
  yandex_d4d8a8b1f49afb69.html \
  dist/
