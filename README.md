# drone-image-manipulation

This project contains the frontend codebase for drone image manipulation tool (app 2).

### Prod setup
- Get runner: https://raw.githubusercontent.com/precision-sustainable-ag/drone-image_processing-api/develop/run.sh
- Execute `./run.sh`
> `run.sh` will create and configure both the frontend (https://github.com/precision-sustainable-ag/drone-image-manipulation) and the backend

> Needs work - adding command comments for reference
```
docker compose --profile dev-local up --remove-orphans
docker compose --profile dev-local up -d --build --force-recreate (detached mode)
```