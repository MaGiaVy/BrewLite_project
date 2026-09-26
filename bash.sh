#!/usr/bin/env bash
cd -- "$(dirname -- "${BASH_SOURCE[0]}")" || exit 1
npm --prefix backend run start:dev &
npm --prefix frontend run dev -- --port 3000 &
wait