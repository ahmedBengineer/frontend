# frontend

## Docker

### Build and run with Docker

```bash
docker build -t pentagon-frontend .
docker run --rm -p 3000:3000 --env-file .env pentagon-frontend
```

### Build and run with Docker Compose

```bash
docker compose up --build -d
```

Stop the container:

```bash
docker compose down
```

The app is available at `http://localhost:3000`.

### Environment variables

Create a `.env` file in the project root and add the variables your app needs (for example API URLs, keys, and tokens).  
`docker-compose.yml` is configured to load `.env` automatically.

### Health checks

- `GET /api/health` - lightweight endpoint for uptime monitors such as UptimeRobot.
- `GET /api/health/deep` - deeper probe that validates configured upstream API reachability.

Optional environment variable:

- `HEALTHCHECK_TARGET_URL`: explicit URL to probe for deep health checks.
  - If not set, deep health falls back to `NEXT_PUBLIC_BASE_URL`.
