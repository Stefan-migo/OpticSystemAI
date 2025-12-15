#!/bin/bash
# Script to push to GitHub with authentication

echo "Pushing to GitHub..."
echo ""
echo "If prompted for credentials:"
echo "  Username: Stefan-migo"
echo "  Password: Use your GitHub Personal Access Token"
echo ""
echo "To create a token: https://github.com/settings/tokens"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo "View your repository at: https://github.com/Stefan-migo/businessManagementApp"
else
    echo ""
    echo "❌ Push failed. Please check your authentication."
    echo "You may need to:"
    echo "  1. Create a Personal Access Token at https://github.com/settings/tokens"
    echo "  2. Use it as your password when prompted"
    echo "  3. Or set up SSH authentication"
fi
