#!/usr/bin/env bash
set -euo pipefail

# OpenCode Auto-Fallback WARP watcher
# Watches fallback.log for error/rate-limit triggers and rotates WARP IP.

FALLBACK_LOG="${FALLBACK_LOG:-$HOME/.local/share/opencode/log/fallback.log}"
WATCH_LOG="$HOME/.config/opencode/warp-rotate/auto-fallback-watch.log"
POS_FILE="$HOME/.config/opencode/warp-rotate/auto-fallback-watch-pos.txt"
LOCK_FILE="$HOME/.config/opencode/warp-rotate/auto-fallback-watch.lock"
ROTATE_SCRIPT="$HOME/.config/opencode/warp-rotate/rotate-warp.sh"
COOLDOWN_SEC=300
POLL_SEC=20

mkdir -p "$(dirname "$WATCH_LOG")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$WATCH_LOG"
}

# flock mutex — exit if another watcher is running
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] watcher already running, exiting" >> "$WATCH_LOG"
  exit 0
fi

log "watcher started — watching $FALLBACK_LOG (poll ${POLL_SEC}s, cooldown ${COOLDOWN_SEC}s)"

# Track last rotation time (epoch seconds)
LAST_ROTATE=0
if [[ -f "$POS_FILE" ]]; then
  # pos file contains byte offset; leave LAST_ROTATE at 0 on fresh start
  :
fi

# Ensure pos file exists
if [[ ! -f "$POS_FILE" ]]; then
  echo 0 > "$POS_FILE"
fi

# If fallback log doesn't exist yet, start at 0
get_size() {
  if [[ -f "$FALLBACK_LOG" ]]; then
    wc -c < "$FALLBACK_LOG" 2>/dev/null | tr -d ' ' || echo 0
  else
    echo 0
  fi
}

# Handle log rotation/truncation: if current size < saved pos, reset pos
read_pos() {
  cat "$POS_FILE" 2>/dev/null || echo 0
}

write_pos() {
  echo "$1" > "$POS_FILE"
}

should_trigger() {
  local chunk="$1"
  if echo "$chunk" | grep -q "Immediate error via session.error"; then return 0; fi
  if echo "$chunk" | grep -q "Retryable error via session.error"; then return 0; fi
  if echo "$chunk" | grep -q "Rate limit"; then return 0; fi
  if echo "$chunk" | grep -q "rate limit"; then return 0; fi
  if echo "$chunk" | grep -q "quota"; then return 0; fi
  if echo "$chunk" | grep -q "Free usage"; then return 0; fi
  return 1
}

while true; do
  POS=$(read_pos)
  # Sanitize POS to integer
  if ! [[ "$POS" =~ ^[0-9]+$ ]]; then
    POS=0
  fi

  SIZE=$(get_size)

  # Detect truncation / rotation
  if [[ "$SIZE" -lt "$POS" ]]; then
    log "log truncated/rotated (size $SIZE < pos $POS), resetting pos to 0"
    POS=0
    write_pos 0
  fi

  if [[ "$SIZE" -gt "$POS" ]] && [[ -f "$FALLBACK_LOG" ]]; then
    # Read new bytes
    CHUNK=$(tail -c +"$((POS + 1))" "$FALLBACK_LOG" 2>/dev/null || true)
    if [[ -n "$CHUNK" ]] && should_trigger "$CHUNK"; then
      NOW=$(date +%s)
      ELAPSED=$((NOW - LAST_ROTATE))
      if [[ "$ELAPSED" -ge "$COOLDOWN_SEC" ]]; then
        MATCH=$(echo "$CHUNK" | grep -E "Immediate error via session\.error|Retryable error via session\.error|Rate limit|rate limit|quota|Free usage" | head -n 1 | tr -d '\n' | cut -c1-200)
        log "trigger detected: $MATCH — rotating WARP"
        if [[ -x "$ROTATE_SCRIPT" ]]; then
          if "$ROTATE_SCRIPT" >> "$WATCH_LOG" 2>&1; then
            log "rotate-warp.sh succeeded"
          else
            log "rotate-warp.sh failed (exit $?)"
          fi
        else
          log "ERROR: rotate script not found/executable: $ROTATE_SCRIPT"
        fi
        LAST_ROTATE=$NOW
      else
        REMAIN=$((COOLDOWN_SEC - ELAPSED))
        log "trigger detected but cooldown active (${REMAIN}s remaining), skipping rotation"
      fi
    fi
    write_pos "$SIZE"
  fi

  sleep "$POLL_SEC"
done
