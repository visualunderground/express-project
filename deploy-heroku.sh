#!/bin/bash

git checkout deploy
git rebase master
grunt build
git add .
git add -f ./app/public
git commit -m 'Adding public files'
git push
git checkout master
