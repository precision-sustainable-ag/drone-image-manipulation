# drone-image-manipulation

This project contains the frontend codebase for drone image manipulation tool (app 2).

### Prod setup
- Get runner: https://raw.githubusercontent.com/precision-sustainable-ag/drone-image_processing-api/develop/run.sh
- Execute `./run.sh`
> `run.sh` will create and configure both the frontend (https://github.com/precision-sustainable-ag/drone-image-manipulation) and the backend

> Needs work - adding command comments for reference

## Configurations
There is no .env file to configure the api url. The different environments are configured using profiles for docker compose. 

Configurations are defined: `docker-compose.yml`.

There are three configurations available:

1. `dev-prod`: This configuration uses the prod API (dronepilotapp.psi.ncsu.edu) and hot-loads frontend code for development
2. `dev-local`: This configuration expects backend API available at localhost:3000 with file server configured in the backend implementation (code is hot-loaded)
3. `prod`: This configuration builds the code for production environment and configures nginx along with reverse-proxy for accessing the API

## Development
Run the docker compose command in the root folder of the codebase
### Frontend development

`docker compose --profile dev-prod up -d --build --force-recreate --remove-orphans`

`docker compose --profile dev-prod up -d` if rebuild is not required.

### Frontend and backend development
`docker compose --profile dev-local up -d --build --force-recreate`