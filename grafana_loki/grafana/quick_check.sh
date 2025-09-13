#!/bin/bash

# Simple wrapper for grafana host connectivity checker
# Since credentials are hardcoded, this script just runs the main script with sample hosts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_SCRIPT="$SCRIPT_DIR/check_grafana_hosts.sh"
SAMPLE_HOSTS="$SCRIPT_DIR/sample_hosts.txt"

# Check if main script exists
if [[ ! -f "$MAIN_SCRIPT" ]]; then
    echo "ERROR: Main script not found: $MAIN_SCRIPT"
    exit 1
fi

# Check if sample hosts file exists
if [[ -f "$SAMPLE_HOSTS" ]]; then
    echo "Running Grafana Host Connectivity Checker with sample hosts..."
    echo "Hosts file: $SAMPLE_HOSTS"
    echo ""
    exec "$MAIN_SCRIPT" -f "$SAMPLE_HOSTS"
else
    echo "Sample hosts file not found: $SAMPLE_HOSTS"
    echo ""
    echo "Usage examples:"
    echo "  $MAIN_SCRIPT -h 'host1,host2,host3'"
    echo "  $MAIN_SCRIPT -f your_hosts.txt"
    exit 1
fi