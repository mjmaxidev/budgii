#!/bin/sh
set -e

cd "$(dirname "$0")/.."

ruff check .
ruff format --check .
