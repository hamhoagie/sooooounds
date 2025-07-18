#!/bin/bash

# Kill any existing node processes running on port 3001
echo "Stopping any existing server processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "No server running on port 3001"

# Wait a moment
sleep 2

# Start the server
echo "Starting server with Replicate integration..."
cd /Users/billy/code/soooounds/server
npm run dev