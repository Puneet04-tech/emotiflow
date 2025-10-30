#!/bin/bash
# EmotiFlow Quick Start Script
# Installs dependencies, builds, and shows how to load in Chrome

echo "🚀 EmotiFlow - Emotional Intelligence Browser Assistant"
echo "======================================================"
echo ""

# Step 1: Install
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Step 2: Type check
echo "🔍 Running TypeScript checks..."
npm run type-check

if [ $? -ne 0 ]; then
    echo "⚠️  TypeScript warnings (non-blocking)"
fi

echo ""

# Step 3: Build
echo "🔨 Building extension..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✓ Build completed successfully!"
echo ""

# Step 4: Instructions
echo "✅ EmotiFlow is ready to deploy!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Open Chrome and go to: chrome://extensions/"
echo ""
echo "2. Enable 'Developer mode' (toggle in top-right corner)"
echo ""
echo "3. Click 'Load unpacked'"
echo ""
echo "4. Select the 'dist' folder in this project directory"
echo ""
echo "5. Grant permissions when prompted:"
echo "   ✓ Camera (for facial emotion detection)"
echo "   ✓ Microphone (for voice tone analysis)"
echo "   ✓ Storage (for encrypted emotion logs)"
echo ""
echo "6. Click the EmotiFlow icon in your toolbar to start!"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - DEPLOYMENT.md (step-by-step guide)"
echo "   - README.md (project overview)"
echo "   - IMPLEMENTATION_SUMMARY.md (technical details)"
echo ""
echo "🎉 Enjoy emotion-aware browsing!"
