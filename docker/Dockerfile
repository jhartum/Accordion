# syntax=docker/dockerfile:1
# Thermocline conductor for Accordion.
#
# CPU variant (default): deterministic folding, no attention scoring.
# GPU variant:           with attention probe (CUDA 12.1, ~5GB image).
#
# Build CPU:
#   docker build -f docker/Dockerfile --target cpu -t accordion-thermocline .
# Build GPU:
#   docker build -f docker/Dockerfile --target gpu -t accordion-thermocline .
# Run:
#   docker run -d --network host --name thermocline accordion-thermocline

# ── Base: shared deps (Node 22, python3 for probe) ─────────────────────────
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends python3 && \
    ln -sf python3 /usr/bin/python && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Shared entrypoint (sets WSL LD_LIBRARY_PATH on GPU; no-op extra on others)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ── CPU variant (no probe — deterministic fallback) ─────────────────────────
FROM base AS cpu
COPY conductors/thermocline/ ./conductors/thermocline/
COPY conductors/attention-folder/scorer.mjs ./conductors/attention-folder/scorer.mjs
# probe.py must exist on disk even if venv missing (fail → fallback)
COPY conductors/attention-folder/probe/probe.py ./conductors/attention-folder/probe/probe.py
RUN cd conductors/thermocline && npm ci --production
EXPOSE 7703
ENV THERMO_HOST=0.0.0.0 THERMO_PORT=7703
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "conductors/thermocline/thermocline.mjs"]

# ── GPU variant (CUDA 12.1 + attention probe) ──────────────────────────────
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04 AS gpu
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates python3 python3-pip python3-venv \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY conductors/ ./conductors/
RUN cd conductors/thermocline && npm ci --production
# Python probe venv with torch
RUN cd conductors/attention-folder && \
    python3 -m venv probe/.venv && \
    probe/.venv/bin/pip install --no-cache-dir \
      torch==2.5.1+cu121 \
      --index-url https://download.pytorch.org/whl/cu121 && \
    probe/.venv/bin/pip install --no-cache-dir -r probe/requirements.txt
EXPOSE 7703
ENV THERMO_HOST=0.0.0.0 THERMO_PORT=7703
# WSL2 GPU: the CUDA loader discovers the driver store via /dev/dxg, then
# dlopen's the real libcuda.so.1.1 from /usr/lib/wsl/drivers/<dir>. The libs
# are bind-mounted from ~/wsl-libs (see setup-wsl-libs.sh + docker-compose).
# entrypoint.sh stitches LD_LIBRARY_PATH together at runtime.
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "conductors/thermocline/thermocline.mjs"]
