#!/bin/bash

# We want to break if anything returns ERRNO > 0
set -e

# Create a clean working space with the latest assets
rm -rf gh-pages && mkdir -p gh-pages
cp -R dist/release/* gh-pages/

# Init a new repo
cd gh-pages
git init
git config user.name "Travis CI"
git config user.email "root@localhost"

# Re-add our origin, using our token from our previous env/global as well as a standard user/repo slug.
git remote add origin https://${GH_TOKEN}@github.com/${TRAVIS_REPO_SLUG}.git > /dev/null

# Re-write the history of our GH-pages branch
git checkout -B gh-pages
git add .
git commit -m "Update GitHub pages to latest release distribution of JS-TDA"

git push origin gh-pages -fq > /dev/null
