FROM docker:24-cli

# Install dependencies
RUN apk add --no-cache \
    bash \
    git \
    curl \
    jq \
    python3 \
    py3-pip \
    docker-compose

# Create working directory
WORKDIR /deploy

# Copy bootstrap script (this one stays in the image)
COPY bootstrap.sh /deploy/bootstrap.sh
RUN chmod +x /deploy/bootstrap.sh

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=10s --retries=3 \
    CMD pgrep -f "deploy.sh" || exit 1

# Run bootstrap script
CMD ["/deploy/bootstrap.sh"]
