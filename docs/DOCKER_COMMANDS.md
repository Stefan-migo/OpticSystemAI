# Docker Container Management Guide

This guide shows you how to check and manage Supabase Docker containers.

## Quick Container Status

### Check All Supabase Containers (Running)

```bash
docker ps --filter "name=supabase"
```

### Check All Supabase Containers (Including Stopped)

```bash
docker ps -a --filter "name=supabase"
```

### Formatted View with Ports

```bash
docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

---

## Detailed Container Information

### List All Container Names

```bash
docker ps --filter "name=supabase" --format "{{.Names}}"
```

### Check Specific Container Status

```bash
docker ps --filter "name=supabase_db_web"
docker ps --filter "name=supabase_kong_web"
docker ps --filter "name=supabase_studio_web"
```

### Inspect Container Details

```bash
# Get detailed information about a container
docker inspect supabase_db_web

# Get specific information (e.g., IP address)
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' supabase_db_web
```

---

## Container Logs

### View Logs for a Specific Container

```bash
# View last 50 lines
docker logs supabase_db_web

# View last 20 lines
docker logs supabase_db_web --tail 20

# Follow logs in real-time
docker logs -f supabase_db_web

# View logs with timestamps
docker logs -t supabase_db_web
```

### View Logs for All Supabase Containers

```bash
# Get all container names and view logs
for container in $(docker ps --filter "name=supabase" --format "{{.Names}}"); do
  echo "=== Logs for $container ==="
  docker logs $container --tail 10
  echo ""
done
```

---

## Container Resource Usage

### Check Resource Usage (CPU, Memory, Network)

```bash
# Real-time stats for all Supabase containers
docker stats --filter "name=supabase"

# One-time snapshot
docker stats --filter "name=supabase" --no-stream

# Formatted output
docker stats supabase_db_web supabase_kong_web --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

---

## Container Health Checks

### Check Container Health Status

```bash
# All containers with health status
docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}"

# Check if specific container is healthy
docker inspect --format='{{.State.Health.Status}}' supabase_db_web
```

### Common Health Status Values:

- `healthy` - Container is running and healthy
- `unhealthy` - Container is running but health check failed
- `starting` - Health check is still running
- `none` - No health check configured

---

## Container Management Commands

### Stop a Specific Container

```bash
docker stop supabase_db_web
```

### Start a Stopped Container

```bash
docker start supabase_db_web
```

### Restart a Container

```bash
docker restart supabase_db_web
```

### Remove a Container (⚠️ Use with caution)

```bash
# Stop first
docker stop supabase_db_web

# Remove
docker rm supabase_db_web
```

---

## Using Supabase CLI Commands

### Check Status via Supabase CLI

```bash
npm run supabase:status
```

This shows:

- API URL
- Database URL
- Studio URL
- Keys (Publishable and Secret)
- All service URLs

### Start/Stop via Supabase CLI

```bash
npm run supabase:start
npm run supabase:stop
```

---

## Common Supabase Containers

Here are the main containers you'll see:

| Container Name           | Purpose                 | Port  |
| ------------------------ | ----------------------- | ----- |
| `supabase_db_web`        | PostgreSQL database     | 54322 |
| `supabase_kong_web`      | API Gateway             | 54321 |
| `supabase_studio_web`    | Supabase Studio UI      | 54323 |
| `supabase_auth_web`      | Authentication service  | 9999  |
| `supabase_rest_web`      | REST API (PostgREST)    | 3000  |
| `supabase_realtime_web`  | Realtime subscriptions  | 4000  |
| `supabase_storage_web`   | Storage API             | 5000  |
| `supabase_inbucket_web`  | Email testing (Mailpit) | 54324 |
| `supabase_analytics_web` | Analytics service       | 54327 |
| `supabase_vector_web`    | Logging (Vector)        | 9001  |
| `supabase_pg_meta_web`   | Database metadata       | 8080  |

---

## Troubleshooting

### Container Keeps Restarting

```bash
# Check logs to see why
docker logs supabase_vector_web --tail 50

# Check container status
docker ps -a --filter "name=supabase_vector_web"
```

### Container Won't Start

```bash
# Check if port is already in use
netstat -ano | findstr :54321  # Windows
lsof -i :54321                 # Mac/Linux

# Check Docker logs
docker logs supabase_db_web
```

### Check Container Network

```bash
# List networks
docker network ls

# Inspect Supabase network
docker network inspect supabase_network_web
```

### Execute Commands Inside Container

```bash
# Access database container shell
docker exec -it supabase_db_web bash

# Run SQL directly
docker exec -i supabase_db_web psql -U postgres -d postgres -c "SELECT version();"
```

---

## Quick Reference Commands

```bash
# Quick status check
docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}"

# View logs for problematic container
docker logs [container_name] --tail 50

# Check resource usage
docker stats --filter "name=supabase" --no-stream

# Restart all Supabase containers
docker restart $(docker ps -q --filter "name=supabase")

# Stop all Supabase containers
docker stop $(docker ps -q --filter "name=supabase")
```

---

## Using Docker Desktop GUI

You can also check containers visually:

1. **Open Docker Desktop**
2. Navigate to **Containers** tab
3. Filter by `supabase` to see all containers
4. Click on any container to:
   - View logs
   - Check stats (CPU, Memory, Network)
   - Inspect configuration
   - Access container shell
   - View container files

---

## Example: Complete Health Check

```bash
#!/bin/bash
echo "=== Supabase Container Status ==="
docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Resource Usage ==="
docker stats --filter "name=supabase" --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo ""
echo "=== Health Status ==="
for container in $(docker ps --filter "name=supabase" --format "{{.Names}}"); do
  health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "none")
  echo "$container: $health"
done
```

Save this as `check-supabase.sh` and run:

```bash
chmod +x check-supabase.sh
./check-supabase.sh
```

---

**Note:** The `supabase_vector_web` container may show as "Restarting" - this is a logging service and won't affect your application functionality. The main services (db, kong, studio, auth) should all show as "healthy".
