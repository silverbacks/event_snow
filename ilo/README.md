# iLO Hardware Monitor for Telegraf

A comprehensive monitoring solution for HP iLO4 and iLO5 hardware using Telegraf agent. This tool provides detailed hardware metrics collection similar to hp-hw-monitor functionality and supports both **remote iLO monitoring** and **local host monitoring**.

## Monitoring Modes

### Remote iLO Monitoring
Monitor HP servers remotely via their iLO (Integrated Lights-Out) management interfaces using REST/Redfish APIs.

### Local Host Monitoring
**NEW:** Monitor the physical host directly from the console using local hardware management tools. This mode is perfect for:
- Servers where iLO access is restricted
- Local console monitoring setups
- More detailed hardware information via direct system access
- Environments where network-based monitoring isn't preferred

## Features

- **Dual Monitoring Modes**: 
  - **Remote**: Traditional iLO network-based monitoring
  - **Local**: Direct host console monitoring (no iLO network access required)
- **Multi-version Support**: Compatible with both iLO4 and iLO5
- **Comprehensive Monitoring**: System health, thermal, power, memory, and storage metrics
- **Multiple Data Sources**: 
  - Remote: iLO REST/Redfish APIs
  - Local: IPMI, lm-sensors, dmidecode, HP management tools, sysfs
- **Telegraf Integration**: Native support for Telegraf agent with proper metric formatting
- **Flexible Configuration**: Support for multiple monitoring targets with individual settings
- **Tool Auto-detection**: Automatically detects and uses available local monitoring tools
- **Error Handling**: Robust error handling and retry mechanisms
- **Secure**: SSL verification options and credential management

## Monitored Metrics

### System Health
- Overall system status and health
- Power state monitoring  
- Component state tracking
- **Local Mode**: System uptime, load averages, IPMI system event log

### Thermal Monitoring
- **Temperature Sensors**: CPU, memory, ambient, and other thermal sensors
- **Fan Status**: Speed (RPM and percentage), operational status
- **Threshold Monitoring**: Critical and warning temperature thresholds
- **Local Sources**: lm-sensors, IPMI sensors, HP management tools, sysfs thermal zones

### Power Management
- **Power Supplies**: Status, capacity, and output monitoring
- **Power Consumption**: Current, average, and maximum power usage
- **Efficiency Metrics**: Power efficiency calculations
- **Local Sources**: IPMI DCMI, HP management tools, ACPI power information

### Memory Monitoring
- **Memory Modules**: Status, capacity, and speed for each DIMM
- **Error Detection**: Memory error monitoring and reporting
- **Manufacturer Information**: Memory module details
- **Local Sources**: dmidecode, /proc/meminfo, IPMI SEL memory events

### Storage Monitoring
- **Drive Status**: Health status for all detected drives
- **Capacity Information**: Storage capacity and utilization
- **Protocol Detection**: SATA, SAS, NVMe protocol identification
- **Local Sources**: smartctl, HP storage management tools

## Installation

### Automated Installation

1. **Download and run the installer**:
   ```bash
   sudo ./install.sh
   ```

2. **Configure your iLO endpoints**:
   ```bash
   sudo nano /etc/ilo-monitor/ilo_config.json
   ```

3. **Test the configuration**:
   ```bash
   /opt/ilo-monitor/test_monitor.sh
   ```

4. **Start Telegraf**:
   ```bash
   sudo systemctl start telegraf
   sudo systemctl enable telegraf
   ```

### Manual Installation

1. **Install Python dependencies**:
   ```bash
   pip3 install requests urllib3
   ```

2. **Copy files to desired locations**:
   ```bash
   sudo mkdir -p /opt/ilo-monitor /etc/ilo-monitor
   sudo cp ilo_monitor.py /opt/ilo-monitor/
   sudo cp ilo_config.json /etc/ilo-monitor/
   sudo cp telegraf_ilo.conf /etc/telegraf/telegraf.d/
   ```

3. **Set permissions**:
   ```bash
   sudo chown -R telegraf:telegraf /opt/ilo-monitor /etc/ilo-monitor
   sudo chmod +x /opt/ilo-monitor/ilo_monitor.py
   ```

## Configuration

### iLO Configuration File

Edit `/etc/ilo-monitor/ilo_config.json`:

```json
{
  "ilo_hosts": [
    {
      "hostname": "ilo.server1.example.com",
      "username": "monitor_user",
      "password": "secure_password",
      "version": "5",
      "port": 443,
      "ssl_verify": false,
      "timeout": 30,
      "tags": {
        "datacenter": "dc1",
        "rack": "A01",
        "server_type": "DL380"
      }
    }
  ]
}
```

### Required iLO User Permissions

Create a dedicated monitoring user in iLO with these minimum privileges:
- **Login**: Yes
- **Remote Console**: No
- **Virtual Media**: No
- **Virtual Power and Reset**: No
- **iLO Config**: No (Read-only system information only)

### Telegraf Configuration

The Telegraf configuration is automatically installed to `/etc/telegraf/telegraf.d/ilo_monitor.conf`. Key settings:

```toml
[[inputs.exec]]
  commands = [
    "python3 /opt/ilo-monitor/ilo_monitor.py --config /etc/ilo-monitor/ilo_config.json"
  ]
  timeout = "60s"
  data_format = "influx"
```

## Usage

### Command Line Options

```bash
# Local monitoring mode (monitor physical host directly)
ilo-monitor --local

# Local mode with specific tools and JSON output
ilo-monitor --local --output json --debug

# Monitor all configured hosts (mix of local and remote)
ilo-monitor --config /etc/ilo-monitor/ilo_config.json

# Local-only configuration
ilo-monitor --config /etc/ilo-monitor/ilo_config_local.json

# Monitor single remote host
ilo-monitor --host ilo.example.com --username admin --password secret --version 5

# Output in JSON format
ilo-monitor --config /etc/ilo-monitor/ilo_config.json --output json

# Enable debug logging
ilo-monitor --config /etc/ilo-monitor/ilo_config.json --debug
```

### Local Mode Requirements

For local monitoring, install one or more of these tools:

```bash
# Ubuntu/Debian
sudo apt-get install ipmitool lm-sensors dmidecode smartmontools

# RHEL/CentOS
sudo yum install ipmitool lm_sensors dmidecode smartmontools

# HP-specific tools (if available)
# Download from HP website:
# - HP System Management Homepage (SMH)
# - HP Agentless Management Service (AMS)
# - hpasmcli, hpssacli tools
```

### Integration Examples

#### With Prometheus (Recommended)
The primary output format uses Prometheus with InfluxDB line protocol:

```bash
# Use the Prometheus-optimized configuration
sudo cp telegraf_prometheus.conf /etc/telegraf/telegraf.d/
sudo systemctl restart telegraf

# Verify Prometheus endpoint
curl http://localhost:9273/metrics
```

**Prometheus Configuration** (`prometheus.yml`):
```yaml
scrape_configs:
  - job_name: 'ilo-hardware-monitoring'
    static_configs:
      - targets: ['localhost:9273']
    scrape_interval: 60s
    metrics_path: /metrics
```

**Key Prometheus Metrics**:
- `ilo_temperature_value` - Temperature readings with status labels
- `ilo_fan_speed_rpm` - Fan speeds with health indicators
- `ilo_power_consumption_current_watts` - Power consumption
- `ilo_health_health_code` - Overall system health (0=Unknown, 1=OK, 2=Warning, 3=Critical)

#### With InfluxDB
```bash
# Direct output to InfluxDB
ilo-monitor --local | influx write --bucket ilo_metrics --precision s
```

#### Local Console Monitoring Pipeline
```bash
# Complete local monitoring pipeline
ilo-monitor --local --output telegraf | telegraf --config telegraf_prometheus.conf
```

#### With Grafana Dashboard
Import the provided Grafana dashboard template or create custom visualizations using these metric patterns:
- `ilo_temperature_*`
- `ilo_fan_*`
- `ilo_power_*`
- `ilo_memory_*`
- `ilo_system_health`

## Metric Format

### Metric Format

### InfluxDB Line Protocol Output
```
ilo_temperature_cpu1,host=localhost,ilo_version=5,status=OK,source=ipmi value=45.0,status_numeric=1 1609459200000000000
ilo_fan_system_fan_1,host=localhost,ilo_version=5,status=OK,source=ipmi speed_rpm=2400,speed_percent=65,status_numeric=1 1609459200000000000
ilo_power_supply_1,host=localhost,ilo_version=5,status=OK,state=Enabled power_capacity=800,power_output=350,status_numeric=1 1609459200000000000
```

### Prometheus Metrics Output
```
# HELP ilo_temperature_value Temperature sensor readings in Celsius
# TYPE ilo_temperature_value gauge
ilo_temperature_value{host="localhost",sensor="cpu1",status="OK",source="ipmi"} 45.0

# HELP ilo_fan_speed_rpm Fan speed in RPM
# TYPE ilo_fan_speed_rpm gauge
ilo_fan_speed_rpm{host="localhost",fan="system_fan_1",status="OK",source="ipmi"} 2400

# HELP ilo_health_health_code System health status code
# TYPE ilo_health_health_code gauge
ilo_health_health_code{host="localhost",health="OK"} 1
```

### Status Code Mapping
For Prometheus alerting and monitoring:
- `0` = Unknown/Absent
- `1` = OK/Good/Enabled  
- `2` = Warning/Degraded
- `3` = Critical/Error/Failed

### JSON Output
```json
{
  "timestamp": 1609459200,
  "ilo_host": "ilo.example.com",
  "ilo_version": "5",
  "system_health": {
    "state": "Enabled",
    "health": "OK",
    "power_state": "On"
  },
  "temperature_cpu1": {
    "value": 45.0,
    "status": "OK",
    "upper_threshold": 85,
    "lower_threshold": 5
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   ```bash
   # Test iLO connectivity
   curl -k -u username:password https://ilo.example.com/rest/v1/
   ```

2. **Authentication Errors**
   - Verify username and password
   - Check user permissions in iLO
   - Ensure account is not locked

3. **SSL Certificate Issues**
   - Set `ssl_verify: false` in configuration
   - Or install proper certificates

4. **Permission Denied**
   ```bash
   # Fix file permissions
   sudo chown -R telegraf:telegraf /opt/ilo-monitor /etc/ilo-monitor
   ```

### Debugging

Enable debug logging:
```bash
ilo-monitor --config /etc/ilo-monitor/ilo_config.json --debug
```

Check Telegraf logs:
```bash
sudo journalctl -u telegraf -f
```

View collected metrics:
```bash
sudo tail -f /var/log/telegraf/ilo_metrics.log
```

### Performance Tuning

1. **Adjust Collection Interval**:
   ```toml
   # In telegraf.conf
   [agent]
     interval = "60s"  # Increase for less frequent collection
   ```

2. **Limit Collected Metrics**:
   ```json
   # In ilo_config.json
   "metrics_config": {
     "collect_storage": false,  # Disable storage monitoring
     "collect_network": false   # Disable network monitoring
   }
   ```

3. **Concurrent Requests**:
   ```json
   "monitoring_settings": {
     "max_concurrent_requests": 3  # Reduce for slower networks
   }
   ```

## Security Considerations

1. **Credential Storage**: Store passwords in environment variables or encrypted files
2. **Network Security**: Use VPN or secure networks for iLO communication
3. **User Privileges**: Create dedicated monitoring users with minimal permissions
4. **SSL Verification**: Enable SSL verification when using trusted certificates

## API Compatibility

### iLO4 REST API
- Endpoint: `/rest/v1/`
- Authentication: Basic Auth
- Format: HP proprietary JSON

### iLO5 Redfish API
- Endpoint: `/redfish/v1/`
- Authentication: Basic Auth / Session
- Format: DMTF Redfish standard

## Alerting with Prometheus

The solution includes comprehensive Prometheus alerting rules in [`ilo_alerting_rules.yml`](/Users/christinejoylulu/workspace/ilo/ilo_alerting_rules.yml):

### Critical Alerts
- System health failures
- Temperature above 85°C
- Fan failures (0 RPM)
- Power supply failures
- Memory module errors

### Warning Alerts  
- High temperatures (75°C+)
- Low fan speeds (<500 RPM)
- Power supply degradation
- High memory usage (90%+)
- High power consumption (90%+ of capacity)

### Example Alert
```yaml
- alert: iLO_Temperature_Critical
  expr: ilo_temperature_value > 85
  for: 1m
  labels:
    severity: critical
    component: thermal
  annotations:
    summary: "Critical temperature on {{ $labels.host }}"
    description: "Temperature sensor {{ $labels.__name__ }} is at {{ $value }}°C"
```

## Monitoring Best Practices

1. **Set Appropriate Intervals**: 60-300 seconds for hardware metrics
2. **Monitor Monitoring**: Include connectivity checks for iLO endpoints
3. **Alert Configuration**: Set up alerts for critical hardware status
4. **Capacity Planning**: Monitor storage and memory utilization trends
5. **Historical Data**: Retain metrics for trend analysis and capacity planning

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request with detailed description

## Support

For issues and feature requests:
1. Check the troubleshooting section
2. Review system logs
3. Test with individual iLO hosts
4. Create detailed issue reports with logs

## License

This project is licensed under the MIT License - see the LICENSE file for details.