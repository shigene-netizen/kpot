#!/bin/sh
# KPOT To Go — one-shot push of the redirect layer to GitHub Pages.
#
# Usage:
#   sh _dev/push_to_github.sh <github-username> [repo-name]
#
# Default repo name is "kpot", which makes the site:
#   https://<github-username>.github.io/kpot/
#
# Run this from the kpot-redirect directory.

set -e

USERNAME="$1"
REPO="${2:-kpot}"

if [ -z "$USERNAME" ]; then
  echo "Usage: sh _dev/push_to_github.sh <github-username> [repo-name]" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

if [ ! -d .git ]; then
  git init
  git branch -M main
fi

git add -A
git commit -m "KPOT To Go redirect layer" || echo "(nothing new to commit)"

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$USERNAME/$REPO.git"
else
  git remote set-url origin "https://github.com/$USERNAME/$REPO.git"
fi

echo
echo "Pushing to https://github.com/$USERNAME/$REPO ..."
echo "When prompted for a password, paste a Personal Access Token (repo scope),"
echo "NOT your GitHub account password."
echo
git push -u origin main

echo
echo "Done. Now enable Pages:"
echo "  https://github.com/$USERNAME/$REPO/settings/pages"
echo "  Source: Deploy from a branch -> main -> / (root) -> Save"
echo
echo "Your stable URL will be:"
echo "  https://$USERNAME.github.io/$REPO/"
