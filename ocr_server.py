"""
本地 OCR 桥接服务 —— 供 homework_checkv2.html 调用。

背景：EasyOCR 是纯 Python 库，浏览器 JS 没法直接调用，需要一个本地 HTTP 服务
把"图片 -> 文字"这一步桥接出来。这个服务只做一件事：接收 base64 图片，
返回 EasyOCR 识别出的文字行（按从上到下的顺序），不做任何"判断对错"的逻辑——
判断对错这一步交给 homework_checkv2.html 里调用的 Ollama 文本模型去做。

启动方式：
  python3 ocr_server.py
默认监听 127.0.0.1:5001。

依赖：
  pip3 install easyocr flask flask-cors

设计要点：
- EasyOCR 的 Reader 初始化（加载模型权重）本身要几秒钟，所以在服务启动时
  只做一次全局初始化，之后每次请求复用同一个 reader，避免每次请求都要
  重新加载模型（那样单次请求会多出 9~10 秒的固定开销）。
- 只识别文字、返回文字+位置+置信度，不在这一层做任何算术判断或语义理解，
  职责边界要清晰：OCR 服务只管"看清字"，大模型只管"判断对错、讲解思路"。
"""

import base64
import io
import time

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 允许浏览器端（file:// 或 http://localhost 打开的页面）跨域调用

print("正在加载 EasyOCR 模型（首次启动会比较慢，请稍候）...")
_t0 = time.time()
import easyocr
READER = easyocr.Reader(["ch_sim", "en"], gpu=False)
print(f"EasyOCR 模型加载完成，耗时 {time.time() - _t0:.2f}s，服务已就绪")


@app.route("/ocr", methods=["POST"])
def ocr():
    data = request.get_json(force=True, silent=True) or {}
    img_b64 = data.get("image", "")
    if not img_b64:
        return jsonify({"error": "缺少 image 字段（base64图片，不含data:前缀）"}), 400

    try:
        img_bytes = base64.b64decode(img_b64)
    except Exception as e:
        return jsonify({"error": f"base64解码失败: {e}"}), 400

    t0 = time.time()
    try:
        # EasyOCR 可以直接吃字节流（内部用 PIL/numpy 解码），不需要先落盘
        result = READER.readtext(img_bytes)
    except Exception as e:
        return jsonify({"error": f"OCR识别失败: {e}"}), 500
    elapsed = time.time() - t0

    # result 的每一项是 (box, text, confidence)，box 是四个角点坐标
    # 按 box 的最小 y 坐标（也就是从上到下的顺序）排序，还原成"一行一行"的阅读顺序
    def top_y(item):
        box = item[0]
        return min(p[1] for p in box)

    result_sorted = sorted(result, key=top_y)

    lines = []
    for box, text, conf in result_sorted:
        # EasyOCR 返回的坐标是 numpy int32/float32 类型，Flask 的 json.dumps 不认识，
        # 必须显式转成 Python 原生 int，否则会报 "Object of type int32 is not JSON serializable"
        xs = [int(p[0]) for p in box]
        ys = [int(p[1]) for p in box]
        lines.append({
            "text": text,
            "confidence": round(float(conf), 4),
            "bbox": [min(xs), min(ys), max(xs), max(ys)],  # 像素坐标 [x1,y1,x2,y2]
        })

    return jsonify({
        "lines": lines,
        "elapsedMs": round(elapsed * 1000, 1),
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
