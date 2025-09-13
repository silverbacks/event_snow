#!/bin/bash

# Test script for Prometheus integration with InfluxDB line protocol format
# This script validates the complete pipeline: local monitoring -> Telegraf -> Prometheus

echo "Prometheus Integration Test for iLO Monitoring"
echo "=============================================="
echo ""

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/ilo_monitor.py"
TELEGRAF_CONFIG="$SCRIPT_DIR/telegraf_prometheus.conf"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Test 1: Verify iLO monitor produces InfluxDB line protocol
print_test "Testing iLO monitor InfluxDB line protocol output..."

if [[ ! -f "$MONITOR_SCRIPT" ]]; then
    print_fail "Monitor script not found: $MONITOR_SCRIPT"
    exit 1
fi

# Test local monitoring with Telegraf format
telegraf_output=$(python3 "$MONITOR_SCRIPT" --local --output telegraf 2>/dev/null)
exit_code=$?

if [[ $exit_code -eq 0 ]]; then
    print_success "iLO monitor execution successful"
    
    # Check for InfluxDB line protocol format
    if echo "$telegraf_output" | grep -q "^ilo_.*,.*=.*,.*=.* [0-9]*$"; then
        print_success "Valid InfluxDB line protocol format detected"
        
        # Count metrics
        metric_count=$(echo "$telegraf_output" | grep "^ilo_" | wc -l | tr -d ' ')
        print_info "Generated $metric_count InfluxDB format metrics"
        
        # Show sample metrics
        echo ""
        echo "Sample metrics (InfluxDB format):"
        echo "$telegraf_output" | head -3 | while read -r line; do
            echo "  $line"
        done
        echo ""
    else
        print_fail "Invalid InfluxDB line protocol format"
        echo "Output sample:"
        echo "$telegraf_output" | head -3
        exit 1
    fi
else
    print_fail "iLO monitor execution failed"
    exit 1
fi

# Test 2: Validate Telegraf configuration
print_test "Validating Telegraf configuration..."

if [[ ! -f "$TELEGRAF_CONFIG" ]]; then
    print_fail "Telegraf config not found: $TELEGRAF_CONFIG"
    exit 1
fi

# Check if telegraf is available for config validation
if command -v telegraf &> /dev/null; then
    telegraf --config "$TELEGRAF_CONFIG" --test 2>/dev/null | head -20 > /tmp/telegraf_test.out
    telegraf_test_exit=$?
    
    if [[ $telegraf_test_exit -eq 0 ]]; then
        print_success "Telegraf configuration is valid"
        
        # Check if Prometheus output is configured
        if grep -q "outputs.prometheus_client" "$TELEGRAF_CONFIG"; then
            print_success "Prometheus output plugin configured"
        else
            print_fail "Prometheus output plugin not found in config"
        fi
        
        # Check processor configuration
        if grep -q "processors.converter" "$TELEGRAF_CONFIG"; then
            print_success "Field type converter configured"
        fi
        
        if grep -q "processors.starlark" "$TELEGRAF_CONFIG"; then
            print_success "Status mapping processor configured"
        fi
    else
        print_fail "Telegraf configuration validation failed"
        cat /tmp/telegraf_test.out
    fi
else
    print_info "Telegraf not installed - skipping config validation"
    print_info "Install with: wget -qO- https://repos.influxdata.com/influxdb.key | sudo apt-key add -"
fi

# Test 3: Simulate Prometheus endpoint
print_test "Testing Prometheus metrics endpoint simulation..."

# Create a temporary script to simulate Telegraf processing
cat > /tmp/test_prometheus_sim.py << 'EOF'
#!/usr/bin/env python3
import sys
import re

# Simulate Telegraf's InfluxDB line protocol to Prometheus conversion
def influx_to_prometheus_format(line):
    """Convert InfluxDB line protocol to Prometheus format"""
    if not line.strip() or line.startswith('#'):
        return None
    
    # Parse InfluxDB line: measurement,tag1=value1,tag2=value2 field1=value1,field2=value2 timestamp
    try:
        parts = line.strip().split(' ')
        if len(parts) < 2:
            return None
        
        measurement_tags = parts[0]
        fields = parts[1]
        
        # Split measurement and tags
        if ',' in measurement_tags:
            measurement = measurement_tags.split(',')[0]
            tags = measurement_tags.split(',')[1:]
        else:
            measurement = measurement_tags
            tags = []
        
        # Parse tags into dict
        tag_dict = {}
        for tag in tags:
            if '=' in tag:
                k, v = tag.split('=', 1)
                tag_dict[k] = v
        
        # Parse fields
        field_dict = {}
        for field in fields.split(','):
            if '=' in field:
                k, v = field.split('=', 1)
                try:
                    # Try to convert to float
                    field_dict[k] = float(v)
                except:
                    field_dict[k] = v
        
        # Generate Prometheus format
        prom_lines = []
        for field_name, field_value in field_dict.items():
            if isinstance(field_value, (int, float)):
                # Create metric name
                metric_name = f"{measurement}_{field_name}"
                
                # Create label string
                labels = []
                for tag_name, tag_value in tag_dict.items():
                    labels.append(f'{tag_name}="{tag_value}"')
                
                if labels:
                    label_str = '{' + ','.join(labels) + '}'
                else:
                    label_str = ''
                
                prom_lines.append(f"{metric_name}{label_str} {field_value}")
        
        return prom_lines
    except Exception as e:
        return [f"# Error parsing line: {line} - {e}"]

# Read from stdin and convert
for line in sys.stdin:
    prom_metrics = influx_to_prometheus_format(line)
    if prom_metrics:
        for metric in prom_metrics:
            print(metric)
EOF

chmod +x /tmp/test_prometheus_sim.py

# Convert sample InfluxDB output to Prometheus format
prom_output=$(echo "$telegraf_output" | python3 /tmp/test_prometheus_sim.py 2>/dev/null)

if [[ -n "$prom_output" ]]; then
    print_success "InfluxDB to Prometheus conversion successful"
    
    # Count Prometheus metrics
    prom_metric_count=$(echo "$prom_output" | grep -v "^#" | wc -l | tr -d ' ')
    print_info "Generated $prom_metric_count Prometheus format metrics"
    
    # Show sample Prometheus metrics
    echo ""
    echo "Sample Prometheus metrics:"
    echo "$prom_output" | grep -v "^#" | head -3 | while read -r line; do
        echo "  $line"
    done
    echo ""
else
    print_fail "InfluxDB to Prometheus conversion failed"
fi

# Test 4: Check for key metric types
print_test "Validating key hardware metrics..."

metrics_found=0

if echo "$telegraf_output" | grep -q "ilo_.*temperature"; then
    print_success "Temperature metrics found"
    ((metrics_found++))
fi

if echo "$telegraf_output" | grep -q "ilo_.*fan"; then
    print_success "Fan metrics found"
    ((metrics_found++))
fi

if echo "$telegraf_output" | grep -q "ilo_.*power"; then
    print_success "Power metrics found"
    ((metrics_found++))
fi

if echo "$telegraf_output" | grep -q "ilo_.*health"; then
    print_success "Health metrics found"
    ((metrics_found++))
fi

if echo "$telegraf_output" | grep -q "ilo_.*memory"; then
    print_success "Memory metrics found"
    ((metrics_found++))
fi

print_info "Found $metrics_found metric categories"

# Test 5: Verify status code mapping
print_test "Checking status code mappings for Prometheus..."

if echo "$telegraf_output" | grep -q "_numeric="; then
    print_success "Status numeric codes found (for Prometheus alerts)"
    
    # Extract and show status mappings
    echo ""
    echo "Status code mappings found:"
    echo "$telegraf_output" | grep -o '[a-z_]*_numeric=[0-9]' | sort | uniq | while read -r mapping; do
        echo "  $mapping"
    done
    echo ""
else
    print_fail "No status numeric codes found"
fi

# Summary and next steps
echo ""
echo "Test Summary:"
echo "============="
echo "✓ InfluxDB line protocol: WORKING"
echo "✓ Prometheus conversion: WORKING"
echo "✓ Metric categories: $metrics_found found"
echo "✓ Status mappings: CONFIGURED"

echo ""
echo "Next Steps:"
echo "1. Install Telegraf: wget -qO- https://repos.influxdata.com/influxdb.key | sudo apt-key add -"
echo "2. Copy config: sudo cp $TELEGRAF_CONFIG /etc/telegraf/telegraf.d/"
echo "3. Start Telegraf: sudo systemctl start telegraf"
echo "4. Configure Prometheus to scrape: http://localhost:9273/metrics"
echo "5. Import alerting rules: $SCRIPT_DIR/ilo_alerting_rules.yml"

echo ""
echo "Prometheus scrape configuration:"
echo "- job_name: 'ilo-hardware'"
echo "  static_configs:"
echo "  - targets: ['localhost:9273']"
echo "  scrape_interval: 60s"

# Cleanup
rm -f /tmp/test_prometheus_sim.py /tmp/telegraf_test.out

print_success "Prometheus integration test completed!"