#!/bin/bash

echo "beginning deployment of GitHub pages..."

# We want to break if anything returns ERRNO > 0
set -e

# Create a clean working space with the latest assets
echo "packaging assets..."
rm -rf gh-pages && mkdir -p gh-pages
cp -R dist/release/* gh-pages/

# Init a new repo
echo "creating new repo..."
cd gh-pages
git init
git config user.name "Travis CI"
git config user.email "root@localhost"

# Re-add our origin, using our token from our previous env/global as well as a standard user/repo slug.
echo "adding origin..."
git remote add origin "https://${GH_PAGES_TOKEN}@github.com/kog/js-tda.git" > /dev/null

# Re-write the history of our GH-pages branch
echo "rebuilding history..."
git checkout -B gh-pages
git add .

echo "committing..."
git commit -m "Update GitHub pages to latest release distribution of JS-TDA"

echo "pushing..."
git push origin gh-pages -fq > /dev/null
