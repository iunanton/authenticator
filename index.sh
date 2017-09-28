#!/bin/bash

docker stop auth
docker cp index.html auth:/usr/src/app
docker start auth
docker logs -f auth
