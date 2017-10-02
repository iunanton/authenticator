#!/bin/bash

docker save -o auth.tar auth
gzip -c auth.tar > auth.tar.gz
rm auth.tar
scp auth.tar.gz asus:~/
ssh asus "docker stop auth"
ssh asus "docker rm auth"
ssh asus "docker rmi auth"
ssh asus "docker load -i ~/auth.tar.gz"
ssh asus "docker run --detach --link mongo:mongo --name=auth --publish=32772:80 --restart=always auth"
rm auth.tar.gz

