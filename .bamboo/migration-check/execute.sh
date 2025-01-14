#!/bin/sh

DB=$1

if [ "$DB" = "mysql" ]; then
  COMPOSE_FILE="artemis-migration-check-mysql.yml"
elif [ "$DB" = "postgresql" ]; then
  COMPOSE_FILE="artemis-migration-check-postgres.yml"
else
  echo "Invalid database type. Please choose either mysql or postgresql."
  exit 1
fi

# Create libs folder because the Artemis docker compose file expects the .war file there
mkdir -p build/libs
mv ./*.war build/libs/

# pass current host's hostname to the docker container for server.url (see docker compose config file)
export HOST_HOSTNAME=$(hostname)

cd docker
#just pull everything else than artemis-app as we build it later either way
docker compose -f $COMPOSE_FILE pull artemis-app $DB
docker compose -f $COMPOSE_FILE build --build-arg WAR_FILE_STAGE=external_builder --no-cache --pull artemis-app
docker compose -f $COMPOSE_FILE up --exit-code-from migration-check
