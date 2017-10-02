#!/bin/bash

docker stop auth
docker cp app.js auth:/usr/src/app
docker start auth
docker logs -f auth

