#!/bin/bash
scp index.html asus:~
ssh asus "docker stop auth"
ssh asus "docker cp index.html auth:/usr/src/app"
ssh asus "rm index.html"
ssh asus "docker start auth"
ssh asus "docker logs -f auth"
