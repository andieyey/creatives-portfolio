#!/bin/bash

echo "Creating template ZIP file..."
echo ""

# Create a temporary directory for template files
rm -rf template-temp
mkdir -p template-temp

# Copy only template files (not this script, git files, etc.)
cp index.html template-temp/
cp styles.css template-temp/
cp script.js template-temp/
cp config.js template-temp/
cp README.md template-temp/
cp QUICK-START.md template-temp/
cp LICENSE template-temp/
cp .gitignore template-temp/
cp -r images template-temp/

# Create ZIP
cd template-temp
zip -r ../portfolio-template.zip *
cd ..

# Clean up
rm -rf template-temp

echo ""
echo "✓ Template ZIP created successfully: portfolio-template.zip"
echo ""
echo "You can now deploy your website with the ZIP file included."
