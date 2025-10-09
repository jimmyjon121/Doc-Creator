#!/bin/bash
echo "Starting Family First Doc Creator Server..."
echo ""
echo "The tool will be available at: http://localhost:8000/AppsCode.html"
echo ""
echo "Press Ctrl+C to stop the server when done."
echo ""
python3 -m http.server 8000
