#!/usr/bin/env bash
set -Eeuo pipefail

# Invoked from an immutable release directory, not from a mutable git checkout.
export IMAGE_PREFIX="${1:?Usage: deploy.sh ghcr.io/owner/repo commit-sha}"
export IMAGE_TAG="${2:?Provide the full commit SHA}"
[[ "$IMAGE_PREFIX" =~ ^ghcr\.io/[a-z0-9_.-]+/[a-z0-9_.-]+$ ]] || exit 2
[[ "$IMAGE_TAG" =~ ^[a-f0-9]{40}$ ]] || exit 2
export RELEASE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
root_dir="$(cd -- "$RELEASE_DIR/../.." && pwd)"
[[ "$RELEASE_DIR" == "$root_dir/releases/$IMAGE_TAG" ]] || exit 2
[[ -f "$root_dir/.env.production" ]] || { echo 'Missing .env.production on VPS' >&2; exit 2; }

# Also serialize manual deployments and wait without canceling a running migration.
exec 9>"$root_dir/deploy.lock"
flock -w 600 9
compose=(docker compose --project-name fiscaliza-ai --project-directory "$root_dir"
  --env-file "$root_dir/.env.production" -f "$RELEASE_DIR/compose.production.yaml")
"${compose[@]}" config --quiet
"${compose[@]}" pull
"${compose[@]}" up -d --wait --wait-timeout 300 --remove-orphans

# Validate the actual public paths, including certificate and API/database health.
public_domain="$("${compose[@]}" exec -T edge printenv PUBLIC_DOMAIN | tr -d '\r')"
municipal_domain="$("${compose[@]}" exec -T edge printenv MUNICIPAL_DOMAIN | tr -d '\r')"
for domain in "$public_domain" "$municipal_domain"; do
  [[ "$domain" =~ ^[a-zA-Z0-9.-]+$ ]] || exit 2
  curl --fail --silent --show-error --retry 12 --retry-all-errors --retry-delay 5 "https://$domain/api/health" >/dev/null
done
curl --fail --silent --show-error "https://$public_domain/LoginScreen" >/dev/null
curl --fail --silent --show-error "https://$municipal_domain/" >/dev/null
printf '%s\n' "$IMAGE_TAG" > "$root_dir/current-release"
echo "Deployment healthy: $IMAGE_TAG"
