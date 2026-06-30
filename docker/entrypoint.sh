#!/usr/bin/env bash
# entrypoint.sh — thermocline container entrypoint.
#
# On WSL2 GPU containers, the NVIDIA CUDA loader (libcuda.so.1) dlopen's the
# real libcuda.so.1.1 from the driver store dir that /dev/dxg points to. The
# bind-mounted libs (from ~/wsl-libs) land at /usr/lib/wsl/lib and
# /usr/lib/wsl/drivers/<WSL_DRIVER_DIR>; we put both on LD_LIBRARY_PATH so the
# loader and its dependencies resolve.
#
# On non-WSL (real nvidia-container-runtime / --gpus all) the runtime already
# injected the host libs, so LD_LIBRARY_PATH is harmless extra.

set -euo pipefail

# Build the WSL library path from whatever driver-store dirs exist.
WSL_LP=""
for d in /usr/lib/wsl/drivers/nv_dispsi.inf_amd64_*; do
  [ -d "$d" ] || continue
  WSL_LP="${WSL_LP:+${WSL_LP}:}${d}"
done
if [ -d /usr/lib/wsl/lib ]; then
  WSL_LP="/usr/lib/wsl/lib${WSL_LP:+:${WSL_LP}}"
fi

if [ -n "${WSL_LP}" ]; then
  export LD_LIBRARY_PATH="${WSL_LP}${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}"
  echo "[entrypoint] WSL GPU libs on LD_LIBRARY_PATH=${WSL_LP}"
fi

exec "$@"
