#!/usr/bin/env python3
"""本地代理服务：给 beads.html 的"AI 生成图案"功能提供 Claude Code 后端。

网页不能直接调用 claude CLI（浏览器没有 shell 权限），所以起这个小服务：
浏览器 fetch 这个服务 -> 服务 shell 出去调 `claude -p` -> 把结果原样传回网页。
不需要任何 API Key：直接复用你本机已登录的 Claude Code 会话。

用法：
    python3 claude_shape_server.py
    # 监听 http://localhost:8765，保持这个终端开着，然后正常打开 beads.html
"""
import http.server
import json
import subprocess
import sys

PORT = 8765
TIMEOUT_SEC = 60


class Handler(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if self.path != '/generate':
            self.send_response(404)
            self._cors()
            self.end_headers()
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length) or b'{}')
            prompt = body.get('prompt', '')
            if not prompt:
                raise ValueError('缺少 prompt 字段')

            result = subprocess.run(
                ['claude', '-p', prompt, '--output-format', 'text'],
                capture_output=True, text=True, timeout=TIMEOUT_SEC,
            )
            if result.returncode != 0:
                raise RuntimeError(f'claude CLI 退出码 {result.returncode}: {result.stderr.strip()[:300]}')

            payload = {'response': result.stdout.strip()}
            self.send_response(200)
        except subprocess.TimeoutExpired:
            payload = {'error': f'claude CLI 超时（超过 {TIMEOUT_SEC} 秒）'}
            self.send_response(504)
        except Exception as e:
            payload = {'error': str(e)}
            self.send_response(500)

        self._cors()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def log_message(self, fmt, *args):
        sys.stderr.write('[claude_shape_server] ' + (fmt % args) + '\n')


if __name__ == '__main__':
    print(f'🤖 Claude 形状生成代理已启动: http://localhost:{PORT}/generate')
    print('   保持这个终端窗口开着，beads.html 里选"Claude Code"引擎时会用到')
    http.server.ThreadingHTTPServer(('localhost', PORT), Handler).serve_forever()
