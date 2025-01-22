newVersion=$(npm version patch)

# if newVersion not empty do the next line
if [ -n "$newVersion" ]
then
    echo $newVersion
    sed -i "s/\(APP_VERSION=\).*/\1$newVersion/" .env
    ssh pinkstaging2 "cd /var/www/node_apps/<APP_NAME> &&  sed -i 's/\(APP_VERSION=\).*/\1$newVersion/' .env"
fi

git push
ssh pinkstaging2 "cd /var/www/node_apps/<APP_NAME> && git pull origin master  && npm install && npm run build && /home/ubuntu/.nvm/versions/node/v21.6.1/bin/pm2 restart <APP_NAME>"



