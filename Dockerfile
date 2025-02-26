FROM denoland/deno:1.41.3

WORKDIR /app

# Copy package configuration files first for better caching
COPY deno.json .
COPY import_map.json* ./ 

# Copy application code
COPY . .

# Pre-cache dependencies for faster rebuilds
RUN deno cache --reload --lock=deno.lock main.ts || \
    (sleep 2 && deno cache --reload main.ts) || \
    (sleep 5 && deno cache --reload main.ts)

# Build Tailwind styles
RUN deno task build

# Default command for production
CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "main.ts"] 