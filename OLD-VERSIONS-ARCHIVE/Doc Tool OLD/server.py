from flask import Flask, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def serve_html():
    return send_from_directory('.', 'AppsCode.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)