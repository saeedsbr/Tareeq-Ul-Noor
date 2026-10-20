#!/bin/bash
# Runs the API (port 8080, internal only) and the website (port 3000) in one container.
# If either process stops, the container stops so Dokploy restarts it.
set -u
java -jar /app/api/app.jar &
API_PID=$!
(cd /app/web && node server.js) &
WEB_PID=$!
trap 'kill $API_PID $WEB_PID 2>/dev/null' TERM INT
wait -n $API_PID $WEB_PID
CODE=$?
kill $API_PID $WEB_PID 2>/dev/null
exit $CODE
