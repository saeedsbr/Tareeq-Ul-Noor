# syntax=docker/dockerfile:1
# Single-image build for Dokploy "Dockerfile" applications: website + API in one container.
# Public port: 3000 (the website). The API listens on 8080 inside the container only; the website proxies /api to it.
# For two separate containers use docker-compose.yml instead.

# ---- API ----
FROM maven:3.9-eclipse-temurin-21 AS api-build
WORKDIR /build
COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline
COPY backend/src ./src
RUN mvn -B -q -DskipTests package && mv target/ilmpath-api-*.jar app.jar

# ---- Website ----
FROM node:22-alpine AS web-deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS web-build
WORKDIR /app
ENV API_URL=http://127.0.0.1:8080 NEXT_TELEMETRY_DISABLED=1
COPY --from=web-deps /app/node_modules ./node_modules
COPY frontend/ .
RUN mkdir -p public && npm run build

# ---- Runtime (Java 21 + Node 22) ----
FROM eclipse-temurin:21-jre
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 1001 --no-create-home app
COPY --from=node:22-slim /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=api-build /build/app.jar api/app.jar
COPY --from=web-build /app/.next/standalone web/
COPY --from=web-build /app/.next/static web/.next/static
COPY --from=web-build /app/public web/public
COPY docker/start.sh /app/start.sh
RUN mkdir -p /data/uploads && chmod +x /app/start.sh && chown -R app:app /app /data
USER app
ENV UPLOAD_DIR=/data/uploads TZ=UTC NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 API_URL=http://127.0.0.1:8080 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=70 -Duser.timezone=UTC" NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=90s --retries=5 CMD curl -fsS http://127.0.0.1:3000/login >/dev/null && curl -fsS http://127.0.0.1:8080/actuator/health >/dev/null || exit 1
CMD ["/app/start.sh"]
