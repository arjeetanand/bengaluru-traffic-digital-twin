#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd -P)"
cd "$ROOT"
PORT=4003
VITE_ENTRY="$ROOT/node_modules/vite/bin/vite.js"
RUNTIME_DIR="$ROOT/.runtime"
PID_FILE="$RUNTIME_DIR/vite.pid"
LOG_FILE="$RUNTIME_DIR/vite.log"

for utility in curl lsof node ps; do
  if ! command -v "$utility" >/dev/null 2>&1; then
    echo "Required command not found: $utility" >&2
    exit 1
  fi
done

if [[ ! -f "$VITE_ENTRY" ]]; then
  echo "Dependencies are missing. Run npm ci first." >&2
  exit 1
fi

is_live_process() {
  local process_state
  process_state="$(ps -p "$1" -o stat= 2>/dev/null | tr -d ' ')"
  [[ -n "$process_state" && "$process_state" != Z* ]]
}

is_owned_listener() {
  local pid="$1"
  local process_cwd process_cmd listeners
  process_cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)"
  process_cmd="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  listeners="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | sort -u || true)"
  [[ "$process_cwd" == "$ROOT" && "$process_cmd" == *"$VITE_ENTRY"* && "$listeners" == "$pid" ]]
}

is_owned_tree_process() {
  local process_cwd process_cmd
  process_cwd="$(lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1 || true)"
  process_cmd="$(ps -p "$1" -o command= 2>/dev/null || true)"
  [[ "$process_cwd" == "$ROOT" && "$process_cmd" == *"$ROOT/"* ]]
}

collect_process_tree() {
  local parent="$1" child children
  owned_process_tree+=("$parent")
  children="$(ps -ax -o pid=,ppid= | awk -v parent="$parent" '$2 == parent { print $1 }')"
  for child in $children; do
    collect_process_tree "$child"
  done
}

if [[ -e "$PID_FILE" ]]; then
  if ! IFS= read -r pid < "$PID_FILE" || [[ ! "$pid" =~ ^[0-9]+$ ]]; then
    echo "Invalid PID file; refusing to stop any process: $PID_FILE" >&2
    exit 1
  fi
  if is_live_process "$pid"; then
    if ! is_owned_listener "$pid"; then
      echo "PID $pid does not match this project's Vite server; refusing to stop it." >&2
      exit 1
    fi
    owned_process_tree=()
    collect_process_tree "$pid"
    for owned_pid in "${owned_process_tree[@]}"; do
      if ! is_owned_tree_process "$owned_pid"; then
        echo "PID $owned_pid is outside this project's process tree; refusing to stop any process." >&2
        exit 1
      fi
    done
    for ((index=${#owned_process_tree[@]} - 1; index >= 0; index--)); do
      owned_pid="${owned_process_tree[$index]}"
      if is_live_process "$owned_pid" && is_owned_tree_process "$owned_pid"; then
        kill -TERM "$owned_pid" 2>/dev/null || true
      fi
    done
    for attempt in {1..40}; do
      still_running=0
      for owned_pid in "${owned_process_tree[@]}"; do
        if is_live_process "$owned_pid" && is_owned_tree_process "$owned_pid"; then
          still_running=1
        fi
      done
      if [[ "$still_running" -eq 0 ]]; then
        break
      fi
      sleep 0.25
    done
    for owned_pid in "${owned_process_tree[@]}"; do
      if is_live_process "$owned_pid" && is_owned_tree_process "$owned_pid"; then
        echo "PID $owned_pid did not stop gracefully; leaving it running." >&2
        exit 1
      fi
    done
  fi
  rm -f "$PID_FILE"
fi

listeners="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | sort -u || true)"
if [[ -n "$listeners" ]]; then
  echo "Port $PORT is already in use by PID(s) $listeners; refusing to stop an unverified process." >&2
  exit 1
fi

mkdir -p "$RUNTIME_DIR"
nohup node "$VITE_ENTRY" --host 127.0.0.1 --port "$PORT" --strictPort > "$LOG_FILE" 2>&1 < /dev/null &
pid=$!
printf '%s\n' "$pid" > "$PID_FILE"

for attempt in {1..40}; do
  if curl --fail --silent "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
    if is_owned_listener "$pid"; then
      echo "Bengaluru Traffic Digital Twin is ready at http://127.0.0.1:$PORT/ (PID $pid)."
      exit 0
    fi
    echo "The server responded, but process ownership could not be verified; PID $pid was left running." >&2
    exit 1
  fi
  if ! is_live_process "$pid"; then
    echo "The server exited during startup. Log: $LOG_FILE" >&2
    tail -n 40 "$LOG_FILE" >&2
    rm -f "$PID_FILE"
    exit 1
  fi
  sleep 0.25
done

echo "Timed out waiting for the server. Log: $LOG_FILE" >&2
tail -n 40 "$LOG_FILE" >&2
exit 1
