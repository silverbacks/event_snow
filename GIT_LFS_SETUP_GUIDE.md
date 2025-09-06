# Git Large File Storage (LFS) Setup Guide

## Problem Resolved

The error you encountered was due to trying to push large Prometheus binary files (>100MB) to GitHub, which exceeds GitHub's file size limit. This has been resolved by:

1. ✅ Removed large binary files (`prometheus-2.45.0.darwin-amd64/` and `promtool`)
2. ✅ Created `.gitignore` to prevent future large file commits
3. ✅ Committed the codebase without large binaries

## Current Repository Status

Your repository now contains:
- ✅ All ServiceNow SNMP trap handlers (Dell, HP, NetApp)
- ✅ MIB reference documents and implementation guides
- ✅ Test examples and validation scenarios
- ✅ Proper `.gitignore` configuration

## For Future Large File Handling

If you need to include large binaries in your repository, follow these steps:

### Option 1: Install Git LFS (Recommended)

#### On macOS (with Homebrew):
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Git LFS
brew install git-lfs

# Initialize Git LFS in your repository
git lfs install

# Track large files (e.g., binaries)
git lfs track "*.exe"
git lfs track "promtool"
git lfs track "prometheus"

# Add the .gitattributes file
git add .gitattributes

# Commit LFS configuration
git commit -m "Add Git LFS configuration"
```

#### On macOS (without Homebrew):
```bash
# Download and install Git LFS manually
curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | sudo bash
sudo apt-get install git-lfs

# Or download from: https://git-lfs.github.io/
```

### Option 2: Use External Storage

For development tools like Prometheus, consider:

1. **Download on demand**: Keep download scripts instead of binaries
2. **Package managers**: Use Homebrew, apt, or other package managers
3. **Docker containers**: Use containerized versions
4. **CI/CD downloads**: Download tools during build processes

### Option 3: Alternative Repositories

For large binary assets:
- **GitHub Releases**: Upload large files as release assets
- **Git Submodules**: Use separate repositories for large files
- **Cloud Storage**: Use S3, Google Drive, or similar services

## Current .gitignore Configuration

The `.gitignore` file now prevents these file types from being committed:

```
# Prometheus binaries (too large for GitHub)
prometheus-*/
promtool
prometheus

# Python virtual environment
.venv/
venv/
env/

# IDE files
.vscode/
.idea/

# Large binary files
*.exe
*.bin
*.gz
*.tar.gz
*.zip

# And more...
```

## Downloading Prometheus Tools

Instead of committing binaries, use these approaches:

### Script to Download Prometheus Tools:
```bash
#!/bin/bash
# download-prometheus.sh

VERSION="2.45.0"
OS="darwin"
ARCH="amd64"

if [ ! -d "prometheus-${VERSION}.${OS}-${ARCH}" ]; then
    echo "Downloading Prometheus ${VERSION}..."
    curl -L "https://github.com/prometheus/prometheus/releases/download/v${VERSION}/prometheus-${VERSION}.${OS}-${ARCH}.tar.gz" | tar xz
    echo "Prometheus downloaded to prometheus-${VERSION}.${OS}-${ARCH}/"
fi

# Create symlinks for easy access
ln -sf "prometheus-${VERSION}.${OS}-${ARCH}/prometheus" prometheus
ln -sf "prometheus-${VERSION}.${OS}-${ARCH}/promtool" promtool
```

### Using Homebrew (Recommended):
```bash
brew install prometheus
# This installs both prometheus and promtool globally
```

## Next Steps

1. **Push to GitHub**: Your repository is now ready to push without errors
2. **Set up remote**: Add your GitHub repository as remote
3. **Push changes**: Push the committed files

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/your-repo.git

# Push to GitHub
git push -u origin main
```

## Repository Contents Summary

Your repository now includes:

### SNMP Trap Handlers:
- Dell iDRAC trap handler with OM Essentials support
- Dell PowerStore storage array trap handler  
- HP/HPE iLO trap handler with dual enterprise OID support
- NetApp CDOT 9.14 trap handler with maxdir support

### Documentation:
- MIB reference documents for each vendor
- Implementation guides with step-by-step instructions
- Test examples and validation scenarios
- Hostname cleaning patterns and examples

### MIB Files:
- Dell, HP, and NetApp MIB files for reference
- Corrected OID mappings based on actual MIB analysis

This provides a complete ServiceNow ITOM integration solution for enterprise storage and server monitoring.

## Support

If you encounter any issues:
1. Check the `.gitignore` file is properly configured
2. Ensure no large files are staged: `git status`
3. Use `git reset HEAD <file>` to unstage large files if needed
4. Consider Git LFS for legitimate large file needs