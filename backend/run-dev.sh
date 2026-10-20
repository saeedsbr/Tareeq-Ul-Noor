#!/usr/bin/env bash
# Local development only. Set DB_PASSWORD to the password you chose in infra/mysql-setup.sql.
export DB_URL="${DB_URL:-jdbc:mysql://127.0.0.1:3306/ilmpath?useUnicode=true&characterEncoding=utf8&connectionTimeZone=UTC&allowPublicKeyRetrieval=true&useSSL=false}"
export DB_USERNAME="${DB_USERNAME:-ilmpath}"
export DB_PASSWORD="${DB_PASSWORD:-change-this-password}"
export JWT_SECRET="dev-only-secret-dev-only-secret-dev-only-secret"
export ILMPATH_ADMIN_EMAIL="admin@ilmpath.test"
export ILMPATH_ADMIN_PASSWORD="Admin@12345"
export ILMPATH_SEED_DEMO=true
cd "$(dirname "$0")" && mvn spring-boot:run
