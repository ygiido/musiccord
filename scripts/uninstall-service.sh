#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
node "$PROJECT_DIR/bin/cli.js" --stop
