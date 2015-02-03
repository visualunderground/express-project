#!/bin/bash

git checkout dist
git rebase master
grunt build
git add -f ./dist
git commit -m 'Adding dist files'
git push heroku dist:master --force
git checkout master