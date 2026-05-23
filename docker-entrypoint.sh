#!/bin/sh
set -e

# Auto-detect host IP for gateway connectivity when host.docker.internal fails.
# This runs inside the container at startup.

resolve_host_ip() {
  # Try host.docker.internal first (Docker Desktop / some Linux setups)
  if getent hosts host.docker.internal >/dev/null 2>&1; then
    getent hosts host.docker.internal | awk '{ print $1 }' | head -n1
    return 0
  fi

  # Fallback: default gateway IP (works on standard Docker bridge networks)
  if command -v ip >/dev/null 2>&1; then
    ip route | awk '/default/ { print $3 }' | head -n1
    return 0
  fi

  # Last resort: parse /proc/net/route (gateway is little-endian hex)
  if [ -r /proc/net/route ]; then
    hex=$(awk '$2 == "00000000" { print $3 }' /proc/net/route | head -n1)
    if [ -n "$hex" ]; then
      # Reverse byte order
      b0=$(echo "$hex" | cut -c7-8)
      b1=$(echo "$hex" | cut -c5-6)
      b2=$(echo "$hex" | cut -c3-4)
      b3=$(echo "$hex" | cut -c1-2)
      printf "%d.%d.%d.%d\n" "0x$b0" "0x$b1" "0x$b2" "0x$b3"
      return 0
    fi
  fi

  return 1
}

exec "$@"
