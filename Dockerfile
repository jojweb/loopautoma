# CI/dev image for LoopAutoma (Rust + Tauri 2 + Bun)
# Base: Ubuntu 24.04 with Tauri Linux deps

FROM ubuntu:24.04

LABEL org.opencontainers.image.source="https://github.com/chrisgleissner/loopautoma"
LABEL org.opencontainers.image.description="LoopAutoma CI/dev image (Rust, Bun, Tauri deps)"

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      wget \
      git \
      pkg-config \
      build-essential \
      libssl-dev \
      libgtk-3-dev \
      libwebkit2gtk-4.1-dev \
      libsoup-3.0-dev \
      librsvg2-dev \
      patchelf \
      libayatana-appindicator3-dev \
      clang \
      libclang-dev \
      cmake \
      xz-utils \
      sudo \
      && rm -rf /var/lib/apt/lists/*

# Install Rust (stable) via rustup
ENV RUSTUP_HOME=/root/.rustup
ENV CARGO_HOME=/root/.cargo
ENV PATH=/root/.cargo/bin:$PATH
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal && \
    rustup default stable

# Install Bun
ENV BUN_INSTALL=/root/.bun
ENV PATH=/root/.bun/bin:$PATH
RUN curl -fsSL https://bun.sh/install | bash

# Optional: Coverage tool for Rust
RUN cargo install cargo-tarpaulin || true

WORKDIR /workspace

# Default to a shell; CI runs will override with commands
CMD ["bash"]
