FROM docker:24-cli

# Install dependencies
RUN apk add --no-cache \
    bash \
    git \
    curl \
    jq \
    python3 \
    py3-pip

# Create working directory
WORKDIR /deploy

# Copy deploy script
COPY deploy.sh /deploy/deploy.sh
RUN chmod +x /deploy/deploy.sh

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
    CMD pgrep -f "deploy.sh" || exit 1

# Run deploy script
CMD ["/deploy/deploy.sh"]
