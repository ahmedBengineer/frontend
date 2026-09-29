#!/usr/bin/env bash
set -euo pipefail

# Required for the Dockerfile's --mount=type=cache layers (npm + .next/cache).
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

branch="${1:?Usage: deploy-docker.sh <branch>}"
minimum_free_gb="${DOCKER_MIN_FREE_GB:-4}"
image_name="${DOCKER_IMAGE_NAME:-pentagon-frontend:latest}"

free_gb() {
  local available_kb
  available_kb="$(df -Pk / | awk 'NR == 2 { print $4 }')"
  echo $((available_kb / 1024 / 1024))
}

print_disk_usage() {
  df -h /
  docker system df || true
}

prune_unused_docker_data() {
  # Age-based prune: drop build layers untouched for a week, keep anything the
  # last build used. Never use -af unconditionally (full cold build every run)
  # and don't rely on --keep-storage, which has historically wiped everything.
  docker image prune -f || true
  docker builder prune -af --filter "until=168h" || true
}

echo "=== Deploying ${branch} ==="
git checkout "${branch}"
git pull --ff-only origin "${branch}"

# git pull may have just rewritten THIS script while bash was still reading it,
# which means the rest of the run can execute stale or shifted lines. Re-exec
# from disk so the whole run uses the committed version (guard stops loops).
if [ "${DEPLOY_REEXEC:-0}" != "1" ]; then
  export DEPLOY_REEXEC=1
  exec bash "$0" "$@"
fi

echo "Disk usage before cleanup:"
print_disk_usage
prune_unused_docker_data

available_gb="$(free_gb)"
if [ "${available_gb}" -lt "${minimum_free_gb}" ]; then
  echo "Only ${available_gb}GB free; removing the running frontend image to make room for the build."
  docker compose stop frontend || true
  docker compose rm -f frontend || true
  docker image rm -f "${image_name}" || true
  # Last resort: only nuke the build cache when we're actually out of disk.
  docker builder prune -af || true
  available_gb="$(free_gb)"
fi

if [ "${available_gb}" -lt "${minimum_free_gb}" ]; then
  echo "ERROR: Only ${available_gb}GB free on /; ${minimum_free_gb}GB is required to build safely."
  echo "Increase the server volume or remove unrelated data, then rerun the deployment."
  print_disk_usage
  exit 1
fi

echo "Disk usage after cleanup (${available_gb}GB free):"
print_disk_usage

docker compose up --build -d --remove-orphans

echo "Waiting for the frontend health endpoint..."
for _ in $(seq 1 18); do
  if curl -fsS --max-time 5 http://localhost:3000/api/health/deep >/dev/null; then
    docker image prune -af --filter "until=24h" || true
    echo "=== Deployment complete ==="
    exit 0
  fi
  sleep 5
done

docker compose logs --tail=100 frontend || true
echo "ERROR: Frontend health check did not pass within 90 seconds."
exit 1
