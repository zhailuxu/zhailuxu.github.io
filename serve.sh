#!/bin/bash
# 慧陪学 服务管理脚本：管理后端 API（node，端口见 server/.env 的 PORT）
# 和前端静态文件服务器（python3，端口见 server/.env 的 ALLOWED_ORIGIN）
#
# 用法：
#   ./serve.sh start    启动（已在运行则跳过）
#   ./serve.sh stop     停止
#   ./serve.sh restart  重启
#   ./serve.sh status   查看运行状态

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT_DIR/server"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

BACKEND_PID_FILE="$LOG_DIR/backend.pid"
STATIC_PID_FILE="$LOG_DIR/static.pid"
BACKEND_LOG="$LOG_DIR/backend.log"
STATIC_LOG="$LOG_DIR/static.log"

# 静态服务器端口，需要和 server/.env 里的 ALLOWED_ORIGIN 对上，否则登录会跨域失败
STATIC_PORT="${STATIC_PORT:-8791}"

is_running() {
  local pid_file="$1"
  [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file" 2>/dev/null)" 2>/dev/null
}

start_backend() {
  if is_running "$BACKEND_PID_FILE"; then
    echo "[后端 API] 已在运行 (PID $(cat "$BACKEND_PID_FILE"))"
    return
  fi
  ( cd "$SERVER_DIR" && exec node index.js >"$BACKEND_LOG" 2>&1 & echo $! > "$BACKEND_PID_FILE" )
  sleep 1
  if is_running "$BACKEND_PID_FILE"; then
    echo "[后端 API] 启动成功 (PID $(cat "$BACKEND_PID_FILE"))，日志：$BACKEND_LOG"
  else
    echo "[后端 API] 启动失败，看日志：$BACKEND_LOG"
    return 1
  fi
}

start_static() {
  if is_running "$STATIC_PID_FILE"; then
    echo "[静态站点] 已在运行 (PID $(cat "$STATIC_PID_FILE"))"
    return
  fi
  ( cd "$ROOT_DIR" && exec python3 -m http.server "$STATIC_PORT" >"$STATIC_LOG" 2>&1 & echo $! > "$STATIC_PID_FILE" )
  sleep 1
  if is_running "$STATIC_PID_FILE"; then
    echo "[静态站点] 启动成功 (PID $(cat "$STATIC_PID_FILE"))，端口 $STATIC_PORT，日志：$STATIC_LOG"
  else
    echo "[静态站点] 启动失败，看日志：$STATIC_LOG"
    return 1
  fi
}

stop_one() {
  local name="$1" pid_file="$2"
  if is_running "$pid_file"; then
    kill "$(cat "$pid_file")" 2>/dev/null
    rm -f "$pid_file"
    echo "[$name] 已停止"
  else
    echo "[$name] 未在运行"
    rm -f "$pid_file"
  fi
}

status_one() {
  local name="$1" pid_file="$2"
  if is_running "$pid_file"; then
    echo "[$name] 运行中 (PID $(cat "$pid_file"))"
  else
    echo "[$name] 未运行"
  fi
}

case "$1" in
  start)
    start_backend
    start_static
    echo "打开 http://localhost:$STATIC_PORT/addsub10.html 体验"
    ;;
  stop)
    stop_one "后端 API" "$BACKEND_PID_FILE"
    stop_one "静态站点" "$STATIC_PID_FILE"
    ;;
  restart)
    stop_one "后端 API" "$BACKEND_PID_FILE"
    stop_one "静态站点" "$STATIC_PID_FILE"
    sleep 1
    start_backend
    start_static
    echo "打开 http://localhost:$STATIC_PORT/addsub10.html 体验"
    ;;
  status)
    status_one "后端 API" "$BACKEND_PID_FILE"
    status_one "静态站点" "$STATIC_PID_FILE"
    ;;
  *)
    echo "用法: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
