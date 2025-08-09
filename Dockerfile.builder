# syntax = docker/dockerfile:1

# This builder Dockerfile, based on Fly.io's official documentation, creates an
# ephemeral machine to securely fetch all application secrets and pass them
# to the main build process. This automates secret management for deployments.

FROM flyio/flyctl:latest as flyio
FROM debian:bullseye-slim

RUN apt-get update; apt-get install -y ca-certificates jq

COPY <<"EOF" /srv/deploy.sh
#!/bin/bash
set -e
deploy=(flyctl deploy --dockerfile Dockerfile)
touch /srv/.secrets

while read -r name; do
  value=$(flyctl secrets get "${name}" -a kaiwa)
  echo "export ${name}='${value}'" >> /srv/.secrets
done < <(flyctl secrets list -a kaiwa --json | jq -r '.[].Name')

deploy+=(--build-secret "ALL_SECRETS=$(base64 --wrap=0 /srv/.secrets)")
"${deploy[@]}"
EOF

RUN chmod +x /srv/deploy.sh

COPY --from=flyio /flyctl /usr/bin

WORKDIR /build
COPY . . 
   