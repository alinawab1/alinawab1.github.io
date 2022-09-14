#!/bin/bash
# Use -f to force overwrite and re-init items that might have failed most likely
echo "Creating Build..."
cd reactflow-app

echo "Installing Dependencies"
npm install

npm run build
echo "Build Created"
cd ..

echo "Copying build to Static Resources.."
mkdir -p ./decsond/main/default/staticresources/JS_ReactFlow
cp ./reactflow-app/dist/index_bundle.js ./decsond/main/default/staticresources/JS_ReactFlow/index_bundle.js

echo "Build Copied!"

echo "Adding Build to Git"
git add ./decsond/main/default/staticresources/JS_ReactFlow/index_bundle.js

echo "Cleaning"
rm ./reactflow-app/dist/index_bundle.js
