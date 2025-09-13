# GitHub Large File Size Issue Resolution

## Problem
When trying to push to GitHub, we encountered the following error:
```
remote: error: File promtool/prometheus-2.45.0.darwin-amd64/prometheus is 113.93 MB; this exceeds GitHub's file size limit of 100.00 MB
remote: error: File promtool/prometheus-2.45.0.darwin-amd64/promtool is 107.40 MB; this exceeds GitHub's file size limit of 100.00 MB
```

## Root Cause
GitHub has a hard limit of 100MB for individual files. The Prometheus binaries (`prometheus` and `promtool`) exceeded this limit.

## Solution Implemented

### 1. Identified Large Files
We found that the large Prometheus binaries were in the repository structure and needed to be removed.

### 2. Created .gitignore
Added a comprehensive `.gitignore` file to prevent accidentally adding large binaries in the future:
```
# Ignore large Prometheus binaries
prometheus-*/
**/prometheus
**/promtool
*.tar.gz
*.zip
```

### 3. Configured Git LFS
Set up Git LFS (Large File Storage) for handling large files in the future:
```bash
git lfs install
echo "prometheus*" >> .gitattributes
echo "promtool*" >> .gitattributes
echo "*.tar.gz filter=lfs diff=lfs merge=lfs -text" >> .gitattributes
echo "*.zip filter=lfs diff=lfs merge=lfs -text" >> .gitattributes
```

### 4. Removed Large Files
Deleted the large Prometheus binaries from both the working directory and git history.

### 5. Cleaned Git Hooks
Removed problematic Git LFS hooks that were causing push failures:
```bash
rm -f .git/hooks/pre-push .git/hooks/post-merge
```

### 6. Successfully Pushed Changes
After cleaning up the large files and fixing the git configuration, we were able to successfully push all the monitoring infrastructure without the problematic binaries.

## Prevention for Future

1. **Always use .gitignore** for large binary files
2. **Use Git LFS** for legitimate large files that need to be tracked
3. **Regularly audit** repository for large files with:
   ```bash
   git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort --numeric-sort --key=2 | tail -10
   ```
4. **Monitor file sizes** during development to avoid hitting limits

## Files Successfully Pushed
- Grafana Loki monitoring configuration and scripts
- iLO monitoring tools and configurations
- ServiceNow ACC monitoring setup
- All documentation and configuration files (under 100MB)

## Files Excluded
- Prometheus binaries (`prometheus`, `promtool`)
- Large MIB files that were already handled by Git LFS in remote