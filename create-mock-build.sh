#!/bin/bash

# 🧪 MOCK BUILD CREATOR FOR TESTING
# Creates a mock dist directory to test audit scripts

echo "🧪 Creating mock build for testing audit scripts..."

# Create dist directory structure
mkdir -p dist/assets

# Create mock index.html
cat > dist/index.html << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Ikusi · Acta Platform</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/assets/ikusi-logo.png" />
    <script type="module" crossorigin src="/assets/main-abc123.js"></script>
    <link rel="stylesheet" href="/assets/main-def456.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# Copy aws-exports.js from public
if [ -f "public/aws-exports.js" ]; then
    cp public/aws-exports.js dist/aws-exports.js
    echo "✅ Copied aws-exports.js from public/"
else
    echo "❌ aws-exports.js not found in public/"
fi

# Create mock assets
cat > dist/assets/main-abc123.js << 'EOF'
// Mock main JavaScript bundle
import { createRoot } from 'react-dom/client';
import App from './App';

// Production API configuration
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
EOF

cat > dist/assets/main-def456.css << 'EOF'
/* Mock main CSS bundle */
body {
  margin: 0;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

#root {
  min-height: 100vh;
}
EOF

# Create 404.html from index.html
cp dist/index.html dist/404.html

echo "✅ Mock build created in dist/"
echo "Files created:"
ls -la dist/
echo ""
ls -la dist/assets/

echo ""
echo "🧪 Mock build is ready for testing audit scripts"