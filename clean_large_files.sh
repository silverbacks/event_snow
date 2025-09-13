#!/bin/bash

# Script to clean large Prometheus binaries from git history
# Use this if the files were previously committed to git

echo "Checking for large files in git history..."

# Find large files in git history
echo "Large files in git history:"
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
    sed -n 's/^blob //p' | \
    sort --numeric-sort --key=2 | \
    awk '$2 > 50000000 {print $2/1024/1024 " MB - " $3}' | \
    tail -20

echo ""
echo "If you see Prometheus binaries above, you can remove them with these commands:"
echo ""
echo "# Remove specific large files from git history:"
echo "git filter-branch --force --index-filter \\"
echo "  'git rm --cached --ignore-unmatch promtool/prometheus-2.45.0.darwin-amd64/prometheus' \\"
echo "  --prune-empty --tag-name-filter cat -- --all"
echo ""
echo "git filter-branch --force --index-filter \\"
echo "  'git rm --cached --ignore-unmatch promtool/prometheus-2.45.0.darwin-amd64/promtool' \\"
echo "  --prune-empty --tag-name-filter cat -- --all"
echo ""
echo "# Alternative: Use git-filter-repo (recommended, but needs installation):"
echo "# pip install git-filter-repo"
echo "# git filter-repo --path promtool/prometheus-2.45.0.darwin-amd64/ --invert-paths"
echo ""
echo "# After cleaning, force push (CAUTION: This rewrites history):"
echo "# git push origin --force --all"
echo ""
echo "# Clean up local references:"
echo "# rm -rf .git/refs/original/"
echo "# git reflog expire --expire=now --all"
echo "# git gc --prune=now --aggressive"

# Check current working directory for large files
echo ""
echo "Checking current directory for large files..."
find . -type f -size +50M 2>/dev/null | while read file; do
    size=$(du -h "$file" | cut -f1)
    echo "Large file found: $file ($size)"
done

echo ""
echo "If no large files are shown above, the issue might be:"
echo "1. You're pushing from a different directory"
echo "2. The files are in a different branch"
echo "3. The files were in a previous commit that's being pushed"