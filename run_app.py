import webbrowser
from threading import Timer
from app import app

def open_browser():
    webbrowser.open_new('http://localhost:5000')

Timer(1, open_browser).start()
app.run()
