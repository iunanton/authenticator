#!/bin/bash

docker build -t auth .
docker run --detach \
	--link mongo:mongo \
	--name=auth \
	--publish-all \
	--restart=always \
	auth > /dev/null
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' auth
docker port auth
