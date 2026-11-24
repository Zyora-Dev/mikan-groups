#!/usr/bin/env bash
# Render build step for the API.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt
