# KidsViewer Server

A comprehensive Golang-based backend server for the KidsViewer application, providing safe content viewing for children with parental controls, learning questions, and progress tracking.

## Features

- **Authentication & Authorization**: JWT-based authentication with parental controls
- **Person Management**: Create and manage child profiles with individual settings
- **Platform Management**: Manage content platforms and age-appropriate filtering
- **Question System**: Interactive learning questions with difficulty levels
- **Watching Sessions**: Time-limited content viewing with periodic questions
- **Caching**: Redis cluster or in-memory caching with expiration
- **Database Support**: SQLite (default) or PostgreSQL
- **Kubernetes Ready**: Graceful shutdown, health checks, and observability
- **OpenTelemetry**: HTTP request metrics and tracing
- **Configuration**: Flexible configuration via files, environment variables, and CLI flags

## Quick Start

### Prerequisites

- Go 1.21 or higher
- SQLite (default) or PostgreSQL
- Redis (optional, for distributed caching)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd server
```

2. Install dependencies:
```bash
go mod tidy
```

3. Copy and configure the configuration file:
```bash
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
```

4. Build the application:
```bash
go build -o kidsviewer-server ./cmd
```

5. Run database migrations:
```bash
./kidsviewer-server migrate up
```

6. Run the server:
```bash
./kidsviewer-server
```

## Configuration

The server supports multiple configuration methods with the following priority (highest to lowest):

1. Command-line flags
2. Environment variables (prefixed with `KIDSVIEWER_`)
3. Configuration file (config.yaml)
4. Default values

### Configuration File

Create a `config.yaml` file based on [`config.example.yaml`](./config.example.yaml):

### Environment Variables

All configuration options can be set via environment variables:

```bash
export KIDSVIEWER_SERVER_PORT=8080
export KIDSVIEWER_DATABASE_TYPE=postgres
export KIDSVIEWER_DATABASE_DSN="host=localhost user=kidsviewer password=password dbname=kidsviewer"
export KIDSVIEWER_CACHE_TYPE=redis
export KIDSVIEWER_JWT_SECRET_KEY="your-secret-key"
```

### Command-line Flags

```bash
./kidsviewer-server --server.port=8080 --database.type=postgres --cache.type=redis
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/verify-parental-password` - Verify parental password

### Person Management
- `GET /api/v1/persons` - Get all persons
- `POST /api/v1/persons` - Create a new person
- `GET /api/v1/persons/:id` - Get person details
- `PUT /api/v1/persons/:id` - Update person
- `DELETE /api/v1/persons/:id` - Delete person
- `PUT /api/v1/persons/:id/settings` - Update person settings
- `GET /api/v1/persons/:id/platforms` - Get available platforms for person
- `GET /api/v1/persons/:id/statistics` - Get person statistics
- `GET /api/v1/persons/:id/progress` - Get learning progress

### Platform Management
- `GET /api/v1/platforms` - Get all platforms
- `POST /api/v1/platforms` - Create a new platform
- `GET /api/v1/platforms/:id` - Get platform details
- `PUT /api/v1/platforms/:id` - Update platform
- `DELETE /api/v1/platforms/:id` - Delete platform

### Question Management
- `GET /api/v1/questions` - Get questions (with pagination and search)
- `POST /api/v1/questions` - Create a new question
- `GET /api/v1/questions/:id` - Get question details
- `PUT /api/v1/questions/:id` - Update question
- `DELETE /api/v1/questions/:id` - Delete question
- `GET /api/v1/questions/templates` - Get question templates
- `POST /api/v1/questions/templates` - Create question template
- `PUT /api/v1/questions/templates/:id` - Update question template
- `DELETE /api/v1/questions/templates/:id` - Delete question template

### Watching Sessions
- `POST /api/v1/watching/start` - Start watching session
- `POST /api/v1/watching/check` - Check watching session status
- `POST /api/v1/watching/verify` - Verify question answer
- `GET /api/v1/watching/history/:person_id` - Get watching history

### Settings
- `GET /api/v1/settings` - Get application settings
- `PUT /api/v1/settings` - Update application settings
- `GET /api/v1/settings/app-info` - Get application information

### Health Checks
- `GET /health` - General health check
- `GET /health/ready` - Readiness probe (Kubernetes)
- `GET /health/live` - Liveness probe (Kubernetes)
- `GET /metrics` - Prometheus metrics

## Database

### Database Migrations

The server includes a built-in migration system that automatically manages database schema and seed data:

```bash
# Run all pending migrations
./kidsviewer-server migrate up

# Check migration status
./kidsviewer-server migrate status
```

Migration files are located in the `migrations/` directory and are organized by database type and version:
- `migrations/sqlite/YYYYMMDD/` - SQLite migrations
- `migrations/postgres/YYYYMMDD/` - PostgreSQL migrations

### SQLite (Default)
The server uses SQLite by default, which is suitable for small to medium deployments:

```yaml
database:
  type: "sqlite"
  dsn: "./data/kidsviewer.db"
```

### PostgreSQL
For production deployments, PostgreSQL is recommended:

```yaml
database:
  type: "postgres"
  postgres:
    host: "localhost"
    port: 5432
    database: "kidsviewer"
    username: "kidsviewer"
    password: "password"
    ssl-mode: "disable"
    timezone: "UTC"
  pool:
    max-open-conns: 25
    max-idle-conns: 5
    conn-max-lifetime: "5m"
```

## Caching

### Memory Cache (Default)
Uses in-memory caching with configurable expiration:

```yaml
cache:
  type: "memory"
  memory:
    max-size: 100
    default-expiration: "10m"
    cleanup-interval: "15m"
```

### Redis
For distributed deployments, Redis cluster is supported:

```yaml
cache:
  type: "redis"
  redis:
    servers: ["redis1:6379", "redis2:6379", "redis3:6379"]
    username: ""
    password: ""
    db: 0
```

## Kubernetes Deployment

The server is designed to run in Kubernetes with proper health checks:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kidsviewer-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: kidsviewer-server
  template:
    metadata:
      labels:
        app: kidsviewer-server
    spec:
      containers:
      - name: kidsviewer-server
        image: kidsviewer-server:latest
        ports:
        - containerPort: 9988
        env:
        - name: KIDSVIEWER_DATABASE_TYPE
          value: "postgres"
        - name: KIDSVIEWER_DATABASE_DSN
          valueFrom:
            secretKeyRef:
              name: kidsviewer-secrets
              key: database-dsn
        - name: KIDSVIEWER_JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: kidsviewer-secrets
              key: jwt-secret
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 9988
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health/live
            port: 9988
          initialDelaySeconds: 15
          periodSeconds: 20
```

## Monitoring

The server exposes Prometheus metrics at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - HTTP request duration
- `active_sessions_total` - Number of active user sessions

## Development

### Running in Development Mode

```bash
# Set debug logging
export KIDSVIEWER_LOGGING_ROOT_LEVEL=DEBUG

# Run with auto-reload (requires air)
air

# Or run directly
go run ./cmd --logging.root-level=DEBUG
```

### Testing

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run integration tests
go test -tags=integration ./...
```

## License

[Your License Here]
