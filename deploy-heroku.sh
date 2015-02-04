#!/bin/bash

# "Automatic deploys from GitHub" are enabled in Heroku monitoring the 'deploy' branch.

git checkout deploy
git rebase master
grunt build
git add .
git add -f ./app/public
git commit -m 'Syncing with master and adding public files'
git push
git checkout master
