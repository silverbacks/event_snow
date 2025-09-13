#!/bin/bash

echo "=== GitHub Large File Size Fix Script ==="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: Not in a git repository. Please run this from your git repository root."
    exit 1
fi

echo "Step 1: Checking current repository status..."
echo "Current directory: $(pwd)"
echo "Git branch: $(git branch --show-current)"
echo ""

# Check for uncommitted large files
echo "Step 2: Checking for large files in working directory..."
large_files=$(find . -name "prometheus" -o -name "promtool" -o -name "prometheus-*" | head -10)
if [ -n "$large_files" ]; then
    echo "Found large Prometheus files:"
    echo "$large_files"
    echo ""
    echo "Removing these files..."
    find . -name "prometheus" -type f -exec rm {} \;
    find . -name "promtool" -type f -exec rm {} \;
    find . -name "prometheus-*" -type d -exec rm -rf {} \; 2>/dev/null
    echo "Files removed."
else
    echo "No large Prometheus files found in working directory."
fi

echo ""
echo "Step 3: Checking git status..."
git status

echo ""
echo "Step 4: Solutions for GitHub file size limit:"
echo ""
echo "If you're still getting the error, try these solutions in order:"
echo ""
echo "SOLUTION 1: Reset and clean approach"
echo "-----------------------------------"
echo "# Reset any staged large files"
echo "git reset HEAD"
echo "git clean -fd"
echo ""
echo "# Add only the files you want"
echo "git add grafana_loki/"
echo "git add ilo/"
echo "git add sn_acc/"
echo "git add .gitignore"
echo "git commit -m 'Add monitoring scripts and configurations'"
echo "git push origin main"
echo ""
echo "SOLUTION 2: If files are in git history"
echo "---------------------------------------"
echo "# Use BFG Repo-Cleaner (recommended)"
echo "# Download from: https://rtyley.github.io/bfg-repo-cleaner/"
echo "# java -jar bfg.jar --delete-files prometheus repo.git"
echo "# java -jar bfg.jar --delete-files promtool repo.git"
echo ""
echo "# Or use git filter-repo:"
echo "# pip install git-filter-repo"
echo "# git filter-repo --path promtool/prometheus-2.45.0.darwin-amd64/ --invert-paths"
echo ""
echo "SOLUTION 3: Create new repository (if above fails)"
echo "-------------------------------------------------"
echo "# 1. Backup your current work"
echo "# cp -r . ../backup"
echo "# 2. Remove .git directory"
echo "# rm -rf .git"
echo "# 3. Initialize new git repository"
echo "# git init"
echo "# git add grafana_loki/ ilo/ sn_acc/ .gitignore README.md"
echo "# git commit -m 'Initial commit with monitoring scripts'"
echo "# git remote add origin <your-github-repo-url>"
echo "# git push -u origin main"

# Check if git-lfs is available
echo ""
echo "Step 5: Setting up Git LFS for future large files..."
if command -v git-lfs >/dev/null 2>&1; then
    echo "Git LFS is available. Setting up for binary files..."
    git lfs install
    echo "prometheus*" >> .gitattributes
    echo "promtool*" >> .gitattributes
    echo "*.tar.gz filter=lfs diff=lfs merge=lfs -text" >> .gitattributes
    echo "*.zip filter=lfs diff=lfs merge=lfs -text" >> .gitattributes
    echo "Git LFS configured for large files."
else
    echo "Git LFS not installed. Install it with:"
    echo "# brew install git-lfs  # on macOS"
    echo "# Or download from: https://git-lfs.github.io/"
fi

echo ""
echo "=== Recommended Immediate Action ==="
echo "Run these commands now:"
echo ""
echo "git add .gitignore"
echo "git add grafana_loki/"
echo "git add ilo/"
echo "git add sn_acc/"
echo "git commit -m 'Add monitoring infrastructure without large binaries'"
echo "git push origin main"