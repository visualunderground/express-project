#!/bin/bash
# "Automatic deploys from GitHub" are enabled in Heroku monitoring the 'deploy' branch.

yellow='\033[1;33m'
nc='\033[0m' # No Color

git checkout deploy

echo -e "${yellow}Deploy: Merge master to deploy${nc}"
git merge master -m 'Merging master into deploy'
#
echo  -e "${yellow}Deploy: Run grunt tasks${nc}"
grunt build
#
echo  -e "${yellow}Deploy: Stage app/public files${nc}"
git add -f ./app/public
#
echo  -e "${yellow}Deploy: Commit public files${nc}"
git commit -m 'Adding app/public files'
#
echo  -e "${yellow}Deploy: Push${nc}"
git push

git checkout master
