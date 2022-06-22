# Docker Configurations


## Folder Structure
This folder does not just solely contain Dockerfiles and Docker-compose files concerning the Artemis Server but also other Deployment/Development related configs for other services in order to run/test Artemis successfully.  
<!--
TODO: Think about moving this stuff somewhere else (partly) or keeping it here.
-->

**Dockerfiles** are in subdirectories according to their service.  
**Docker-compose** files are in the main directory if they can be combined/extended with other Docker-compose files.
Docker-compose files with specific artemis configurations or which can't be combined with the default artemis docker-compose file are in the according service subdirectories.  
All **other config files** are also in the according service subdirectories.

### ./artemis/
artemis dockerfile and related files
### ./central-server-config/
config files for the JHipster registry
### ./cypress/
cypress e2e testing suite with complete docker-compose file and own artemis config file
### ./gitlab/
customized gitlab docker container for Artemis
### ./jenkins/
customized jenkins docker container for Artemis one with swift
### ./prometheus/
prometheus config file

<!--
TODO: refactor depending on global extension strategy (override yamls vs extend keyword and Docker-compose v2)
-->
## Atlassian Setup

You can start a local Atlassian stack (Jira, Bitbucket, Bamboo) using the `atlassian.yml` docker-compose file. We build the docker images in [this repository](https://github.com/ls1intum/Artemis-Local-Setup-Docker)

Start vanilla atlassian stack:
```
docker-compose -f atlassian.yml up -d
```


Start atlassian stack which can execute `C` builds:

```
docker-compose -f atlassian.yml -f atlassian.c.override.yml up -d
```

Start atlassian stack which can execute `swift` builds:
```
docker-compose -f atlassian.yml -f atlassian.swift.override.yml up -d
```
