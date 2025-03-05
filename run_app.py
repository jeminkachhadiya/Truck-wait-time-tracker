import webbrowser
from threading import Timer
from waitress import serve
from app import app

def open_browser():
    webbrowser.open_new('http://localhost:8080')

if __name__ == '__main__':
    Timer(1, open_browser).start()
    serve(app, host='0.0.0.0', port=8080)
