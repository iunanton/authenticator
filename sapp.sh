#!/bin/bash
scp app.js asus:~
ssh asus "docker stop auth"
ssh asus "docker cp app.js auth:/usr/src/app"
ssh asus "rm app.js"
ssh asus "docker start auth"
ssh asus "docker logs -f auth"

