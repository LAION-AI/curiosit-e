FROM denoland/deno:1.41.3

WORKDIR /app

# Copy application code
COPY . .

# Configure DNS and add retry mechanism for dependency caching
RUN echo "nameserver 8.8.8.8" > /etc/resolv.conf && \
    echo "nameserver 8.8.4.4" >> /etc/resolv.conf && \
    deno cache --reload main.ts || \
    (sleep 2 && deno cache --reload main.ts) || \
    (sleep 5 && deno cache --reload main.ts)

# Build Tailwind styles
RUN deno task build

# Run the application
CMD ["run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "main.ts"] 