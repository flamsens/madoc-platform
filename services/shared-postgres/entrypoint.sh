#!/bin/bash
set -e

source /usr/local/bin/docker-entrypoint.sh

if [ "$1" = 'postgres' ]; then
    docker_setup_env

    chown -R postgres "$PGDATA"

    if [ -z "$(ls -A "$PGDATA")" ]; then
        gosu postgres initdb
    fi

    if [ "$(id -u)" = '0' ]; then
      # then restart script as postgres user
      exec gosu postgres "$BASH_SOURCE" "$@"
    fi

    pg_setup_hba_conf

    docker_temp_server_start


## Model api
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
DO \$\$
BEGIN
  RAISE NOTICE 'adding new user $POSTGRES_MODELS_API_USER';
  CREATE ROLE $POSTGRES_MODELS_API_USER LOGIN PASSWORD '$POSTGRES_MODELS_API_PASSWORD';
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_MODELS_API_USER;


  EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'not creating role $POSTGRES_MODELS_API_USER -- it already exists';
END
\$\$;

CREATE SCHEMA IF NOT EXISTS $POSTGRES_MODELS_API_SCHEMA AUTHORIZATION $POSTGRES_MODELS_API_USER;

ALTER ROLE $POSTGRES_MODELS_API_USER SET search_path TO $POSTGRES_MODELS_API_SCHEMA, public;
EOSQL

## Tasks API.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
DO \$\$
BEGIN
  CREATE ROLE $POSTGRES_TASKS_API_USER LOGIN PASSWORD '$POSTGRES_TASKS_API_PASSWORD';
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_TASKS_API_USER;


  EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'not creating role $POSTGRES_TASKS_API_USER -- it already exists';
END
\$\$;

CREATE SCHEMA IF NOT EXISTS $POSTGRES_TASKS_API_SCHEMA AUTHORIZATION $POSTGRES_TASKS_API_USER;

ALTER ROLE $POSTGRES_TASKS_API_USER SET search_path TO $POSTGRES_TASKS_API_SCHEMA, public;
EOSQL

## Config Service Database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
DO \$\$
BEGIN
  CREATE ROLE $POSTGRES_CONFIG_SERVICE_USER LOGIN PASSWORD '$POSTGRES_CONFIG_SERVICE_PASSWORD';
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_CONFIG_SERVICE_USER;


  EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'not creating role $POSTGRES_CONFIG_SERVICE_USER -- it already exists';
END
\$\$;

CREATE SCHEMA IF NOT EXISTS $POSTGRES_CONFIG_SERVICE_SCHEMA AUTHORIZATION $POSTGRES_CONFIG_SERVICE_USER;

ALTER ROLE $POSTGRES_CONFIG_SERVICE_USER SET search_path TO $POSTGRES_CONFIG_SERVICE_SCHEMA, public;
EOSQL

## Madoc TS database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
DO \$\$
BEGIN
  CREATE ROLE $POSTGRES_MADOC_TS_USER LOGIN PASSWORD '$POSTGRES_MADOC_TS_PASSWORD';
  GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_MADOC_TS_USER;


  EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'not creating role $POSTGRES_MADOC_TS_USER -- it already exists';
END
\$\$;

CREATE SCHEMA IF NOT EXISTS $POSTGRES_MADOC_TS_SCHEMA AUTHORIZATION $POSTGRES_MADOC_TS_USER;

ALTER ROLE $POSTGRES_MADOC_TS_USER SET search_path TO $POSTGRES_MADOC_TS_SCHEMA, public;
EOSQL


## Extensions

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "$POSTGRES_DB" <<-"EOSQL"

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "$POSTGRES_DB" <<-"EOSQL"

CREATE EXTENSION IF NOT EXISTS "ltree";

EOSQL


    docker_temp_server_stop
fi

exec "$@"
