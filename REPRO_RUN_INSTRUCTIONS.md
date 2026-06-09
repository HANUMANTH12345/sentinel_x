# Repro: Run Cyber-Defense-Hub (Docker)

## 1) Start containers
```sh
docker compose up --build
```

## 2) Verify frontend
- http://localhost:4173/

## 3) Verify backend health
- API should listen on port 5000 (inside container)
- API routes are mounted under `/api`.

## 4) Known startup failure (current)
If api-server crashes with:
- `ENOENT: no such file or directory, open '/app/artifacts/api-server/data/geoip-country.dat'`

Then you must provide the GeoIP dataset files:
- Copy `geoip-country.dat` into:
  - `artifacts/api-server/data/geoip-country.dat`

After adding the file, restart:
```sh
docker compose up --build
```

