#!/usr/bin/env bash
set -e
# Transform the building block repo into a machine readable format
basedir=$(dirname "$0")
python3 "$basedir/generate_structure.py" "$1" "$2"