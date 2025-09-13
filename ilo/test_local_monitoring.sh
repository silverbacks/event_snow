#!/bin/bash

# Test script for local iLO monitoring
# This script tests the local monitoring capabilities without requiring iLO access

echo "iLO Local Monitoring Test Script"
echo "================================="
echo ""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/ilo_monitor.py"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Check if script exists
if [[ ! -f "$MONITOR_SCRIPT" ]]; then
    print_fail "Monitor script not found: $MONITOR_SCRIPT"
    exit 1
fi

# Check Python and dependencies
print_test "Checking Python and dependencies..."
if ! python3 -c "import requests, json, subprocess, glob, re" 2>/dev/null; then
    print_fail "Python dependencies missing. Install with: pip3 install requests"
    exit 1
fi
print_success "Python dependencies OK"

# Check available tools
print_test "Checking available monitoring tools..."

check_tool() {
    local tool=$1
    if command -v "$tool" &> /dev/null; then
        print_success "$tool is available"
        return 0
    else
        echo "  - $tool: not found"
        return 1
    fi
}

tools_found=0
echo "Tool availability:"
check_tool "ipmitool" && ((tools_found++))
check_tool "sensors" && ((tools_found++))
check_tool "dmidecode" && ((tools_found++))
check_tool "smartctl" && ((tools_found++))
check_tool "hpasmcli" && ((tools_found++))
check_tool "hpssacli" && ((tools_found++))

if [[ $tools_found -eq 0 ]]; then
    print_fail "No monitoring tools found. Install at least ipmitool or lm-sensors"
    echo "  Ubuntu/Debian: sudo apt-get install ipmitool lm-sensors dmidecode"
    echo "  RHEL/CentOS:   sudo yum install ipmitool lm_sensors dmidecode"
    exit 1
fi

print_success "Found $tools_found monitoring tools"

# Test local mode execution
print_test "Testing local monitoring mode..."

# Test with JSON output for easier parsing
echo "Running: python3 $MONITOR_SCRIPT --local --output json"
output=$(python3 "$MONITOR_SCRIPT" --local --output json 2>&1)
exit_code=$?

if [[ $exit_code -eq 0 ]]; then
    print_success "Local monitoring execution successful"
    
    # Try to parse JSON output
    if echo "$output" | python3 -m json.tool > /dev/null 2>&1; then
        print_success "JSON output is valid"
        
        # Check for expected metrics
        metrics_found=0
        if echo "$output" | grep -q '"system_health"'; then
            echo "  ✓ System health metrics found"
            ((metrics_found++))
        fi
        if echo "$output" | grep -q '"temperature_"'; then
            echo "  ✓ Temperature metrics found"
            ((metrics_found++))
        fi
        if echo "$output" | grep -q '"fan_"'; then
            echo "  ✓ Fan metrics found"
            ((metrics_found++))
        fi
        if echo "$output" | grep -q '"power_"'; then
            echo "  ✓ Power metrics found"
            ((metrics_found++))
        fi
        if echo "$output" | grep -q '"memory_"'; then
            echo "  ✓ Memory metrics found"
            ((metrics_found++))
        fi
        
        if [[ $metrics_found -gt 0 ]]; then
            print_success "Found $metrics_found metric categories"
        else
            print_fail "No expected metrics found in output"
        fi
    else
        print_fail "Invalid JSON output"
        echo "Output preview:"
        echo "$output" | head -10
    fi
else
    print_fail "Local monitoring execution failed (exit code: $exit_code)"
    echo "Error output:"
    echo "$output"
    exit 1
fi

# Test Telegraf format
print_test "Testing Telegraf output format..."
telegraf_output=$(python3 "$MONITOR_SCRIPT" --local --output telegraf 2>&1)
telegraf_exit_code=$?

if [[ $telegraf_exit_code -eq 0 ]]; then
    print_success "Telegraf format output successful"
    
    # Check for Telegraf line protocol format
    if echo "$telegraf_output" | grep -q "ilo_.*,.*=.*,.*=.* [0-9]*$"; then
        print_success "Telegraf line protocol format detected"
        
        # Count lines of metrics
        metric_lines=$(echo "$telegraf_output" | grep "^ilo_" | wc -l)
        echo "  Generated $metric_lines metric lines"
    else
        print_fail "Invalid Telegraf line protocol format"
        echo "Output preview:"
        echo "$telegraf_output" | head -5
    fi
else
    print_fail "Telegraf format execution failed"
    echo "$telegraf_output"
fi

# Test with config file (local mode)
print_test "Testing with local configuration file..."
local_config="$SCRIPT_DIR/ilo_config_local.json"

if [[ -f "$local_config" ]]; then
    config_output=$(python3 "$MONITOR_SCRIPT" --config "$local_config" --output json 2>&1)
    config_exit_code=$?
    
    if [[ $config_exit_code -eq 0 ]]; then
        print_success "Local config file test passed"
    else
        print_fail "Local config file test failed"
        echo "$config_output"
    fi
else
    echo "  Local config file not found: $local_config"
fi

# Summary
echo ""
echo "Test Summary:"
echo "============="
echo "Tools available: $tools_found"
if [[ $exit_code -eq 0 ]]; then
    echo "Local monitoring: WORKING"
else
    echo "Local monitoring: FAILED"
fi

if [[ $telegraf_exit_code -eq 0 ]]; then
    echo "Telegraf output: WORKING"
else
    echo "Telegraf output: FAILED"
fi

echo ""
echo "Next steps:"
echo "1. Install missing monitoring tools if needed"
echo "2. Run with --debug flag for detailed information"
echo "3. Configure Telegraf to use: python3 $MONITOR_SCRIPT --local"
echo "4. Test with: sudo systemctl restart telegraf"

if [[ $exit_code -eq 0 && $telegraf_exit_code -eq 0 ]]; then
    print_success "All tests passed! Local monitoring is ready."
    exit 0
else
    print_fail "Some tests failed. Check the output above."
    exit 1
fi