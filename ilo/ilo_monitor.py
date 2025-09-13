#!/usr/bin/env python3
"""
iLO Hardware Monitor Script for Telegraf Agent
Monitors HP iLO4 and iLO5 hardware status including:
- Server health
- Temperature sensors
- Fan status
- Power supplies
- Memory modules
- Storage devices
- Network interfaces

Compatible with both iLO4 and iLO5 REST APIs
"""

import json
import sys
import time
import argparse
import logging
import requests
import urllib3
import subprocess
import os
import glob
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from requests.auth import HTTPBasicAuth

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

@dataclass
class iLOConfig:
    """Configuration for iLO connection"""
    hostname: str
    username: str
    password: str
    version: str  # "4" or "5"
    port: int = 443
    ssl_verify: bool = False
    timeout: int = 30
    local_mode: bool = False  # True for local host monitoring

class iLOMonitor:
    """HP iLO Hardware Monitor"""
    
    def __init__(self, config: iLOConfig):
        self.config = config
        self.local_mode = config.local_mode
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        if not self.local_mode:
            # Remote iLO monitoring setup
            self.session = requests.Session()
            self.session.auth = HTTPBasicAuth(config.username, config.password)
            self.session.verify = config.ssl_verify
            self.session.timeout = config.timeout
            
            # API endpoints based on iLO version
            self.base_url = f"https://{config.hostname}:{config.port}"
            if config.version == "5":
                self.api_base = f"{self.base_url}/redfish/v1"
            else:  # iLO4
                self.api_base = f"{self.base_url}/rest/v1"
        else:
            # Local monitoring setup
            self.logger.info("Running in local mode - monitoring physical host directly")
            self._check_local_tools()
    
    def _check_local_tools(self):
        """Check for available local monitoring tools"""
        self.available_tools = {
            'ipmitool': self._check_command('ipmitool'),
            'hplog': self._check_command('hplog'),
            'hpasmcli': self._check_command('hpasmcli'),
            'dmidecode': self._check_command('dmidecode'),
            'sensors': self._check_command('sensors'),
            'smartctl': self._check_command('smartctl'),
            'hpssacli': self._check_command('hpssacli'),
            'ssacli': self._check_command('ssacli'),
        }
        
        available = [tool for tool, status in self.available_tools.items() if status]
        self.logger.info(f"Available local monitoring tools: {', '.join(available)}")
        
        if not any(self.available_tools.values()):
            self.logger.warning("No hardware monitoring tools found. Install ipmitool, hpasmcli, or HP management tools.")
    
    def _check_command(self, command: str) -> bool:
        """Check if a command is available"""
        try:
            subprocess.run([command, '--version'], capture_output=True, timeout=5)
            return True
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
            try:
                subprocess.run(['which', command], capture_output=True, timeout=5, check=True)
                return True
            except:
                return False
    
    def _run_command(self, command: List[str]) -> Optional[str]:
        """Run a system command and return output"""
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                self.logger.error(f"Command failed: {' '.join(command)} - {result.stderr}")
                return None
        except subprocess.TimeoutExpired:
            self.logger.error(f"Command timeout: {' '.join(command)}")
            return None
        except Exception as e:
            self.logger.error(f"Command error: {' '.join(command)} - {e}")
            return None
    
    def make_request(self, endpoint: str) -> Optional[Dict]:
        """Make HTTP request to iLO API (remote mode only)"""
        if self.local_mode:
            self.logger.error("make_request called in local mode")
            return None
            
        url = f"{self.api_base}{endpoint}"
        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request failed for {url}: {e}")
            return None
        except json.JSONDecodeError as e:
            self.logger.error(f"JSON decode error for {url}: {e}")
            return None
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        metrics = {}
        
        if self.local_mode:
            return self._get_local_system_health()
        
        # Remote iLO monitoring
        if self.config.version == "5":
            # iLO5 Redfish API
            data = self.make_request("/Systems/1/")
            if data:
                status = data.get("Status", {})
                metrics["system_health"] = {
                    "state": status.get("State", "Unknown"),
                    "health": status.get("Health", "Unknown"),
                    "power_state": data.get("PowerState", "Unknown")
                }
        else:
            # iLO4 REST API
            data = self.make_request("/Systems/1")
            if data:
                status = data.get("Status", {})
                metrics["system_health"] = {
                    "state": status.get("State", "Unknown"),
                    "health": status.get("Health", "Unknown"),
                    "power_state": data.get("Power", "Unknown")
                }
        
        return metrics
    
    def _get_local_system_health(self) -> Dict[str, Any]:
        """Get system health from local host"""
        metrics = {}
        
        # Check system uptime and load
        try:
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.read().split()[0])
            
            with open('/proc/loadavg', 'r') as f:
                load_avg = f.read().split()[:3]
            
            metrics["system_health"] = {
                "state": "Enabled",
                "health": "OK",
                "power_state": "On",
                "uptime_seconds": uptime_seconds,
                "load_1min": float(load_avg[0]),
                "load_5min": float(load_avg[1]),
                "load_15min": float(load_avg[2])
            }
        except Exception as e:
            self.logger.error(f"Error reading system stats: {e}")
            metrics["system_health"] = {
                "state": "Unknown",
                "health": "Unknown",
                "power_state": "Unknown"
            }
        
        # Use IPMI for additional health info if available
        if self.available_tools.get('ipmitool'):
            ipmi_health = self._get_ipmi_system_health()
            if ipmi_health:
                metrics["system_health"].update(ipmi_health)
        
        return metrics
    
    def _get_ipmi_system_health(self) -> Dict[str, Any]:
        """Get system health via IPMI"""
        health_data = {}
        
        # Get chassis status
        chassis_output = self._run_command(['ipmitool', 'chassis', 'status'])
        if chassis_output:
            for line in chassis_output.split('\n'):
                if 'System Power' in line:
                    power_state = line.split(':')[1].strip()
                    health_data['ipmi_power_state'] = power_state
                elif 'Power Overload' in line:
                    overload = 'true' in line.lower()
                    health_data['power_overload'] = overload
        
        # Get SEL (System Event Log) summary
        sel_output = self._run_command(['ipmitool', 'sel', 'elist', 'last', '10'])
        if sel_output:
            error_count = 0
            warning_count = 0
            for line in sel_output.split('\n'):
                if any(word in line.lower() for word in ['error', 'fail', 'critical']):
                    error_count += 1
                elif any(word in line.lower() for word in ['warning', 'assert']):
                    warning_count += 1
            
            health_data['recent_errors'] = error_count
            health_data['recent_warnings'] = warning_count
            
            # Determine overall health based on recent events
            if error_count > 0:
                health_data['ipmi_health'] = 'Critical'
            elif warning_count > 2:
                health_data['ipmi_health'] = 'Warning'
            else:
                health_data['ipmi_health'] = 'OK'
        
        return health_data
    
    def get_thermal_metrics(self) -> Dict[str, Any]:
        """Get temperature and fan metrics"""
        metrics = {}
        
        if self.local_mode:
            return self._get_local_thermal_metrics()
        
        # Remote iLO monitoring
        if self.config.version == "5":
            # Get thermal data from Redfish
            thermal_data = self.make_request("/Chassis/1/Thermal/")
            if thermal_data:
                # Temperature sensors
                temperatures = thermal_data.get("Temperatures", [])
                for temp in temperatures:
                    sensor_name = temp.get("Name", "Unknown").replace(" ", "_").lower()
                    metrics[f"temperature_{sensor_name}"] = {
                        "value": temp.get("ReadingCelsius", 0),
                        "status": temp.get("Status", {}).get("Health", "Unknown"),
                        "upper_threshold": temp.get("UpperThresholdCritical"),
                        "lower_threshold": temp.get("LowerThresholdCritical")
                    }
                
                # Fan sensors
                fans = thermal_data.get("Fans", [])
                for fan in fans:
                    fan_name = fan.get("Name", "Unknown").replace(" ", "_").lower()
                    metrics[f"fan_{fan_name}"] = {
                        "speed_rpm": fan.get("Reading", 0),
                        "speed_percent": fan.get("ReadingUnits", 0),
                        "status": fan.get("Status", {}).get("Health", "Unknown")
                    }
        else:
            # iLO4 thermal data
            thermal_data = self.make_request("/Chassis/1/Thermal")
            if thermal_data:
                # Process similar structure for iLO4
                temperatures = thermal_data.get("Temperature", [])
                for temp in temperatures:
                    sensor_name = temp.get("Label", "Unknown").replace(" ", "_").lower()
                    metrics[f"temperature_{sensor_name}"] = {
                        "value": temp.get("CurrentReading", 0),
                        "status": temp.get("Status", {}).get("Health", "Unknown")
                    }
                
                fans = thermal_data.get("Fans", [])
                for fan in fans:
                    fan_name = fan.get("Label", "Unknown").replace(" ", "_").lower()
                    metrics[f"fan_{fan_name}"] = {
                        "speed_percent": fan.get("CurrentReading", 0),
                        "status": fan.get("Status", {}).get("Health", "Unknown")
                    }
        
        return metrics
    
    def _get_local_thermal_metrics(self) -> Dict[str, Any]:
        """Get thermal metrics from local host"""
        metrics = {}
        
        # Try lm-sensors first
        if self.available_tools.get('sensors'):
            sensors_data = self._get_sensors_data()
            metrics.update(sensors_data)
        
        # Try IPMI sensors
        if self.available_tools.get('ipmitool'):
            ipmi_data = self._get_ipmi_thermal_data()
            metrics.update(ipmi_data)
        
        # Try HP-specific tools
        if self.available_tools.get('hpasmcli'):
            hp_data = self._get_hp_thermal_data()
            metrics.update(hp_data)
        
        # Read from /sys filesystem as fallback
        sys_data = self._get_sys_thermal_data()
        metrics.update(sys_data)
        
        return metrics
    
    def _get_sensors_data(self) -> Dict[str, Any]:
        """Get thermal data from lm-sensors"""
        metrics = {}
        sensors_output = self._run_command(['sensors', '-A', '-j'])
        
        if sensors_output:
            try:
                sensors_json = json.loads(sensors_output)
                for chip_name, chip_data in sensors_json.items():
                    if isinstance(chip_data, dict):
                        for sensor_name, sensor_data in chip_data.items():
                            if isinstance(sensor_data, dict):
                                # Temperature sensors
                                if any(key.endswith('_input') for key in sensor_data.keys()):
                                    for key, value in sensor_data.items():
                                        if key.endswith('_input') and isinstance(value, (int, float)):
                                            clean_name = f"{chip_name}_{sensor_name}".replace('-', '_').replace(' ', '_').lower()
                                            metrics[f"temperature_{clean_name}"] = {
                                                "value": value,
                                                "status": "OK",
                                                "source": "lm_sensors"
                                            }
                                            
                                            # Add thresholds if available
                                            crit_key = key.replace('_input', '_crit')
                                            max_key = key.replace('_input', '_max')
                                            if crit_key in sensor_data:
                                                metrics[f"temperature_{clean_name}"]["upper_threshold"] = sensor_data[crit_key]
                                            if max_key in sensor_data:
                                                metrics[f"temperature_{clean_name}"]["upper_threshold_warning"] = sensor_data[max_key]
                                
                                # Fan sensors
                                if 'fan' in sensor_name.lower():
                                    for key, value in sensor_data.items():
                                        if key.endswith('_input') and isinstance(value, (int, float)):
                                            clean_name = f"{chip_name}_{sensor_name}".replace('-', '_').replace(' ', '_').lower()
                                            metrics[f"fan_{clean_name}"] = {
                                                "speed_rpm": value,
                                                "status": "OK" if value > 0 else "Warning",
                                                "source": "lm_sensors"
                                            }
            except json.JSONDecodeError:
                # Fall back to text parsing
                self._parse_sensors_text_output(sensors_output, metrics)
        
        return metrics
    
    def _parse_sensors_text_output(self, output: str, metrics: Dict) -> None:
        """Parse text output from sensors command"""
        current_chip = None
        for line in output.split('\n'):
            line = line.strip()
            if not line or line.startswith('Adapter:'):
                continue
            
            if ':' not in line:
                current_chip = line.replace('-', '_').replace(' ', '_').lower()
                continue
            
            if current_chip and ':' in line:
                parts = line.split(':')
                sensor_name = parts[0].strip().replace(' ', '_').lower()
                value_part = parts[1].strip()
                
                # Extract numeric value
                temp_match = re.search(r'([+-]?\d+\.?\d*)°C', value_part)
                rpm_match = re.search(r'(\d+)\s*RPM', value_part)
                
                if temp_match:
                    temp_value = float(temp_match.group(1))
                    metrics[f"temperature_{current_chip}_{sensor_name}"] = {
                        "value": temp_value,
                        "status": "OK",
                        "source": "lm_sensors"
                    }
                elif rpm_match:
                    rpm_value = int(rpm_match.group(1))
                    metrics[f"fan_{current_chip}_{sensor_name}"] = {
                        "speed_rpm": rpm_value,
                        "status": "OK" if rpm_value > 0 else "Warning",
                        "source": "lm_sensors"
                    }
    
    def _get_ipmi_thermal_data(self) -> Dict[str, Any]:
        """Get thermal data via IPMI"""
        metrics = {}
        
        # Get sensor readings
        sdr_output = self._run_command(['ipmitool', 'sdr', 'type', 'temperature'])
        if sdr_output:
            for line in sdr_output.split('\n'):
                if '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 3:
                        sensor_name = parts[0].replace(' ', '_').lower()
                        value_str = parts[1]
                        status = parts[2]
                        
                        # Extract temperature value
                        temp_match = re.search(r'([+-]?\d+(?:\.\d+)?)\s*degrees', value_str)
                        if temp_match:
                            temp_value = float(temp_match.group(1))
                            metrics[f"temperature_ipmi_{sensor_name}"] = {
                                "value": temp_value,
                                "status": status,
                                "source": "ipmi"
                            }
        
        # Get fan readings
        fan_output = self._run_command(['ipmitool', 'sdr', 'type', 'fan'])
        if fan_output:
            for line in fan_output.split('\n'):
                if '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 3:
                        sensor_name = parts[0].replace(' ', '_').lower()
                        value_str = parts[1]
                        status = parts[2]
                        
                        # Extract RPM value
                        rpm_match = re.search(r'(\d+)\s*RPM', value_str)
                        if rpm_match:
                            rpm_value = int(rpm_match.group(1))
                            metrics[f"fan_ipmi_{sensor_name}"] = {
                                "speed_rpm": rpm_value,
                                "status": status,
                                "source": "ipmi"
                            }
        
        return metrics
    
    def _get_hp_thermal_data(self) -> Dict[str, Any]:
        """Get thermal data from HP management tools"""
        metrics = {}
        
        # Get temperature data
        temp_output = self._run_command(['hpasmcli', '-s', 'show temp'])
        if temp_output:
            for line in temp_output.split('\n'):
                if 'C/' in line and 'F' in line:
                    # Parse HP temperature format
                    parts = line.split()
                    if len(parts) >= 4:
                        sensor_name = '_'.join(parts[1:-2]).lower().replace(' ', '_')
                        temp_match = re.search(r'(\d+)C', line)
                        if temp_match:
                            temp_value = int(temp_match.group(1))
                            status = "OK" if "NORMAL" in line.upper() else "Warning"
                            metrics[f"temperature_hp_{sensor_name}"] = {
                                "value": temp_value,
                                "status": status,
                                "source": "hpasmcli"
                            }
        
        # Get fan data
        fan_output = self._run_command(['hpasmcli', '-s', 'show fans'])
        if fan_output:
            for line in fan_output.split('\n'):
                if '%' in line and ('Fan' in line or 'fan' in line):
                    parts = line.split()
                    if len(parts) >= 4:
                        fan_name = '_'.join(parts[1:-2]).lower().replace(' ', '_')
                        percent_match = re.search(r'(\d+)%', line)
                        if percent_match:
                            percent_value = int(percent_match.group(1))
                            status = "OK" if "NORMAL" in line.upper() else "Warning"
                            metrics[f"fan_hp_{fan_name}"] = {
                                "speed_percent": percent_value,
                                "status": status,
                                "source": "hpasmcli"
                            }
        
        return metrics
    
    def _get_sys_thermal_data(self) -> Dict[str, Any]:
        """Get thermal data from /sys filesystem"""
        metrics = {}
        
        # Read thermal zones
        thermal_zones = glob.glob('/sys/class/thermal/thermal_zone*/temp')
        for zone_file in thermal_zones:
            try:
                with open(zone_file, 'r') as f:
                    temp_millicelsius = int(f.read().strip())
                    temp_celsius = temp_millicelsius / 1000.0
                
                zone_name = os.path.basename(os.path.dirname(zone_file))
                
                # Try to get the thermal zone type
                type_file = os.path.join(os.path.dirname(zone_file), 'type')
                zone_type = "unknown"
                try:
                    with open(type_file, 'r') as f:
                        zone_type = f.read().strip().replace('-', '_').replace(' ', '_')
                except:
                    pass
                
                metrics[f"temperature_sys_{zone_type}_{zone_name}"] = {
                    "value": temp_celsius,
                    "status": "OK",
                    "source": "sysfs"
                }
            except (ValueError, IOError):
                continue
        
        # Read hwmon sensors
        hwmon_dirs = glob.glob('/sys/class/hwmon/hwmon*/temp*_input')
        for temp_file in hwmon_dirs:
            try:
                with open(temp_file, 'r') as f:
                    temp_millicelsius = int(f.read().strip())
                    temp_celsius = temp_millicelsius / 1000.0
                
                # Get sensor name
                hwmon_dir = os.path.dirname(temp_file)
                sensor_id = os.path.basename(temp_file).replace('_input', '')
                
                # Try to get a descriptive name
                name_file = os.path.join(hwmon_dir, 'name')
                hwmon_name = "hwmon"
                try:
                    with open(name_file, 'r') as f:
                        hwmon_name = f.read().strip().replace('-', '_').replace(' ', '_')
                except:
                    pass
                
                metrics[f"temperature_hwmon_{hwmon_name}_{sensor_id}"] = {
                    "value": temp_celsius,
                    "status": "OK",
                    "source": "hwmon"
                }
            except (ValueError, IOError):
                continue
        
        return metrics
    
    def get_power_metrics(self) -> Dict[str, Any]:
        """Get power supply and consumption metrics"""
        metrics = {}
        
        if self.local_mode:
            return self._get_local_power_metrics()
        
        # Remote iLO monitoring
        if self.config.version == "5":
            power_data = self.make_request("/Chassis/1/Power/")
            if power_data:
                # Power supplies
                power_supplies = power_data.get("PowerSupplies", [])
                for i, ps in enumerate(power_supplies):
                    metrics[f"power_supply_{i+1}"] = {
                        "status": ps.get("Status", {}).get("Health", "Unknown"),
                        "state": ps.get("Status", {}).get("State", "Unknown"),
                        "power_capacity": ps.get("PowerCapacityWatts", 0),
                        "power_output": ps.get("PowerOutputWatts", 0)
                    }
                
                # Power consumption
                power_control = power_data.get("PowerControl", [])
                if power_control:
                    pc = power_control[0]
                    metrics["power_consumption"] = {
                        "current_watts": pc.get("PowerConsumedWatts", 0),
                        "average_watts": pc.get("AverageConsumedWatts", 0),
                        "max_watts": pc.get("PowerCapacityWatts", 0)
                    }
        else:
            # iLO4 power data
            power_data = self.make_request("/Chassis/1/Power")
            if power_data:
                power_supplies = power_data.get("PowerSupplies", [])
                for i, ps in enumerate(power_supplies):
                    metrics[f"power_supply_{i+1}"] = {
                        "status": ps.get("Status", {}).get("Health", "Unknown"),
                        "state": ps.get("Status", {}).get("State", "Unknown")
                    }
        
        return metrics
    
    def _get_local_power_metrics(self) -> Dict[str, Any]:
        """Get power metrics from local host"""
        metrics = {}
        
        # Try IPMI power monitoring
        if self.available_tools.get('ipmitool'):
            ipmi_power = self._get_ipmi_power_data()
            metrics.update(ipmi_power)
        
        # Try HP management tools
        if self.available_tools.get('hpasmcli'):
            hp_power = self._get_hp_power_data()
            metrics.update(hp_power)
        
        # Read from ACPI/sysfs
        sys_power = self._get_sys_power_data()
        metrics.update(sys_power)
        
        return metrics
    
    def _get_ipmi_power_data(self) -> Dict[str, Any]:
        """Get power data via IPMI"""
        metrics = {}
        
        # Get power supply status
        psu_output = self._run_command(['ipmitool', 'sdr', 'type', 'Power Supply'])
        if psu_output:
            psu_count = 0
            for line in psu_output.split('\n'):
                if '|' in line:
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 3:
                        psu_count += 1
                        psu_name = parts[0].replace(' ', '_').lower()
                        status = parts[2]
                        
                        metrics[f"power_supply_ipmi_{psu_count}"] = {
                            "status": status,
                            "name": psu_name,
                            "source": "ipmi"
                        }
        
        # Try to get power consumption if supported
        power_output = self._run_command(['ipmitool', 'dcmi', 'power', 'reading'])
        if power_output:
            for line in power_output.split('\n'):
                if 'Current Power' in line:
                    power_match = re.search(r'(\d+)\s*Watts', line)
                    if power_match:
                        current_power = int(power_match.group(1))
                        metrics["power_consumption"] = {
                            "current_watts": current_power,
                            "source": "ipmi_dcmi"
                        }
                elif 'Average Power' in line:
                    avg_match = re.search(r'(\d+)\s*Watts', line)
                    if avg_match and "power_consumption" in metrics:
                        metrics["power_consumption"]["average_watts"] = int(avg_match.group(1))
                elif 'Max Power' in line:
                    max_match = re.search(r'(\d+)\s*Watts', line)
                    if max_match and "power_consumption" in metrics:
                        metrics["power_consumption"]["max_watts"] = int(max_match.group(1))
        
        return metrics
    
    def _get_hp_power_data(self) -> Dict[str, Any]:
        """Get power data from HP management tools"""
        metrics = {}
        
        # Get power supply status
        psu_output = self._run_command(['hpasmcli', '-s', 'show powersupply'])
        if psu_output:
            psu_count = 0
            for line in psu_output.split('\n'):
                if 'Power supply' in line:
                    psu_count += 1
                    status = "OK" if "Yes" in line else "Warning"
                    metrics[f"power_supply_hp_{psu_count}"] = {
                        "status": status,
                        "source": "hpasmcli"
                    }
        
        return metrics
    
    def _get_sys_power_data(self) -> Dict[str, Any]:
        """Get power data from /sys filesystem"""
        metrics = {}
        
        # Try to read from power_supply class
        power_supplies = glob.glob('/sys/class/power_supply/*/type')
        for ps_type_file in power_supplies:
            try:
                with open(ps_type_file, 'r') as f:
                    ps_type = f.read().strip()
                
                if ps_type in ['Mains', 'UPS']:  # AC power supplies
                    ps_dir = os.path.dirname(ps_type_file)
                    ps_name = os.path.basename(ps_dir)
                    
                    # Read status
                    status_file = os.path.join(ps_dir, 'online')
                    if os.path.exists(status_file):
                        with open(status_file, 'r') as f:
                            online = f.read().strip() == '1'
                        
                        metrics[f"power_supply_sys_{ps_name}"] = {
                            "status": "OK" if online else "Critical",
                            "online": online,
                            "type": ps_type,
                            "source": "sysfs"
                        }
            except (IOError, ValueError):
                continue
        
        # Try Intel RAPL (Running Average Power Limit) for power consumption
        rapl_files = glob.glob('/sys/class/powercap/intel-rapl*/energy_uj')
        if rapl_files:
            total_energy = 0
            rapl_count = 0
            for rapl_file in rapl_files:
                try:
                    with open(rapl_file, 'r') as f:
                        energy_uj = int(f.read().strip())
                        total_energy += energy_uj
                        rapl_count += 1
                except (IOError, ValueError):
                    continue
            
            if rapl_count > 0:
                # Note: This is energy, not power. Need time difference for power calculation
                metrics["energy_consumption"] = {
                    "total_energy_uj": total_energy,
                    "rapl_domains": rapl_count,
                    "source": "intel_rapl"
                }
        
        return metrics
    
    def get_memory_metrics(self) -> Dict[str, Any]:
        """Get memory module status"""
        metrics = {}
        
        if self.local_mode:
            return self._get_local_memory_metrics()
        
        # Remote iLO monitoring
        if self.config.version == "5":
            memory_data = self.make_request("/Systems/1/Memory/")
            if memory_data:
                members = memory_data.get("Members", [])
                for member in members:
                    mem_url = member.get("@odata.id", "")
                    if mem_url:
                        mem_detail = self.make_request(mem_url.replace("/redfish/v1", ""))
                        if mem_detail:
                            slot = mem_detail.get("DeviceLocator", "Unknown")
                            metrics[f"memory_{slot}"] = {
                                "status": mem_detail.get("Status", {}).get("Health", "Unknown"),
                                "size_mb": mem_detail.get("CapacityMiB", 0),
                                "speed_mhz": mem_detail.get("OperatingSpeedMhz", 0),
                                "manufacturer": mem_detail.get("Manufacturer", "Unknown")
                            }
        else:
            # iLO4 memory data
            memory_data = self.make_request("/Systems/1/Memory")
            if memory_data:
                # Process iLO4 memory structure
                pass
        
        return metrics
    
    def _get_local_memory_metrics(self) -> Dict[str, Any]:
        """Get memory metrics from local host"""
        metrics = {}
        
        # Try dmidecode for detailed memory info
        if self.available_tools.get('dmidecode'):
            dmi_memory = self._get_dmidecode_memory()
            metrics.update(dmi_memory)
        
        # Get memory usage from /proc/meminfo
        sys_memory = self._get_sys_memory_info()
        metrics.update(sys_memory)
        
        # Try IPMI memory monitoring
        if self.available_tools.get('ipmitool'):
            ipmi_memory = self._get_ipmi_memory_data()
            metrics.update(ipmi_memory)
        
        return metrics
    
    def _get_dmidecode_memory(self) -> Dict[str, Any]:
        """Get memory information from dmidecode"""
        metrics = {}
        
        # Get memory device information
        dmi_output = self._run_command(['dmidecode', '-t', 'memory'])
        if dmi_output:
            current_dimm = None
            for line in dmi_output.split('\n'):
                line = line.strip()
                
                if line.startswith('Memory Device'):
                    current_dimm = {}
                elif current_dimm is not None:
                    if line.startswith('Locator:'):
                        locator = line.split(':', 1)[1].strip()
                        current_dimm['locator'] = locator
                    elif line.startswith('Size:'):
                        size_str = line.split(':', 1)[1].strip()
                        if 'MB' in size_str:
                            size_match = re.search(r'(\d+)\s*MB', size_str)
                            if size_match:
                                current_dimm['size_mb'] = int(size_match.group(1))
                        elif 'GB' in size_str:
                            size_match = re.search(r'(\d+)\s*GB', size_str)
                            if size_match:
                                current_dimm['size_mb'] = int(size_match.group(1)) * 1024
                    elif line.startswith('Speed:'):
                        speed_str = line.split(':', 1)[1].strip()
                        speed_match = re.search(r'(\d+)\s*MT/s', speed_str)
                        if speed_match:
                            current_dimm['speed_mhz'] = int(speed_match.group(1))
                    elif line.startswith('Manufacturer:'):
                        manufacturer = line.split(':', 1)[1].strip()
                        current_dimm['manufacturer'] = manufacturer
                    elif line.startswith('Type:'):
                        mem_type = line.split(':', 1)[1].strip()
                        current_dimm['type'] = mem_type
                    elif line == '' and current_dimm and 'locator' in current_dimm:
                        # End of memory device section
                        if current_dimm.get('size_mb', 0) > 0:  # Only include populated slots
                            locator = current_dimm['locator'].replace(' ', '_').lower()
                            metrics[f"memory_dimm_{locator}"] = {
                                "status": "OK",  # dmidecode doesn't provide health status
                                "size_mb": current_dimm.get('size_mb', 0),
                                "speed_mhz": current_dimm.get('speed_mhz', 0),
                                "manufacturer": current_dimm.get('manufacturer', "Unknown"),
                                "type": current_dimm.get('type', "Unknown"),
                                "source": "dmidecode"
                            }
                        current_dimm = None
        
        return metrics
    
    def _get_sys_memory_info(self) -> Dict[str, Any]:
        """Get memory usage information from /proc/meminfo"""
        metrics = {}
        
        try:
            with open('/proc/meminfo', 'r') as f:
                meminfo = f.read()
            
            memory_stats = {}
            for line in meminfo.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Extract numeric value (usually in kB)
                    value_match = re.search(r'(\d+)', value)
                    if value_match:
                        memory_stats[key] = int(value_match.group(1))
            
            if memory_stats:
                total_kb = memory_stats.get('MemTotal', 0)
                free_kb = memory_stats.get('MemFree', 0)
                available_kb = memory_stats.get('MemAvailable', free_kb)
                buffers_kb = memory_stats.get('Buffers', 0)
                cached_kb = memory_stats.get('Cached', 0)
                
                used_kb = total_kb - available_kb
                
                metrics["memory_usage"] = {
                    "total_mb": total_kb // 1024,
                    "used_mb": used_kb // 1024,
                    "free_mb": free_kb // 1024,
                    "available_mb": available_kb // 1024,
                    "buffers_mb": buffers_kb // 1024,
                    "cached_mb": cached_kb // 1024,
                    "usage_percent": (used_kb / total_kb * 100) if total_kb > 0 else 0,
                    "source": "proc_meminfo"
                }
        except IOError:
            pass
        
        return metrics
    
    def _get_ipmi_memory_data(self) -> Dict[str, Any]:
        """Get memory error information via IPMI"""
        metrics = {}
        
        # Check for memory-related SEL entries
        sel_output = self._run_command(['ipmitool', 'sel', 'elist'])
        if sel_output:
            memory_errors = 0
            memory_warnings = 0
            
            for line in sel_output.split('\n'):
                if any(term in line.lower() for term in ['memory', 'dimm', 'ecc']):
                    if any(term in line.lower() for term in ['error', 'fail', 'critical']):
                        memory_errors += 1
                    elif any(term in line.lower() for term in ['warning', 'correctable']):
                        memory_warnings += 1
            
            if memory_errors > 0 or memory_warnings > 0:
                metrics["memory_health"] = {
                    "error_count": memory_errors,
                    "warning_count": memory_warnings,
                    "status": "Critical" if memory_errors > 0 else "Warning" if memory_warnings > 0 else "OK",
                    "source": "ipmi_sel"
                }
        
        return metrics
    
    def get_storage_metrics(self) -> Dict[str, Any]:
        """Get storage device status"""
        metrics = {}
        
        if self.config.version == "5":
            storage_data = self.make_request("/Systems/1/Storage/")
            if storage_data:
                members = storage_data.get("Members", [])
                for member in members:
                    storage_url = member.get("@odata.id", "")
                    if storage_url:
                        storage_detail = self.make_request(storage_url.replace("/redfish/v1", ""))
                        if storage_detail:
                            drives = storage_detail.get("Drives", [])
                            for drive in drives:
                                drive_url = drive.get("@odata.id", "")
                                if drive_url:
                                    drive_detail = self.make_request(drive_url.replace("/redfish/v1", ""))
                                    if drive_detail:
                                        drive_name = drive_detail.get("Name", "Unknown").replace(" ", "_").lower()
                                        metrics[f"drive_{drive_name}"] = {
                                            "status": drive_detail.get("Status", {}).get("Health", "Unknown"),
                                            "capacity_gb": drive_detail.get("CapacityBytes", 0) // (1024**3),
                                            "protocol": drive_detail.get("Protocol", "Unknown"),
                                            "media_type": drive_detail.get("MediaType", "Unknown")
                                        }
        
        return metrics
    
    def collect_all_metrics(self) -> Dict[str, Any]:
        """Collect all hardware metrics"""
        all_metrics = {
            "timestamp": int(time.time()),
            "ilo_host": self.config.hostname,
            "ilo_version": self.config.version
        }
        
        # Collect different metric types
        try:
            all_metrics.update(self.get_system_health())
            all_metrics.update(self.get_thermal_metrics())
            all_metrics.update(self.get_power_metrics())
            all_metrics.update(self.get_memory_metrics())
            all_metrics.update(self.get_storage_metrics())
        except Exception as e:
            self.logger.error(f"Error collecting metrics: {e}")
            all_metrics["collection_error"] = str(e)
        
        return all_metrics
    
    def format_for_telegraf(self, metrics: Dict[str, Any]) -> str:
        """Format metrics for Telegraf input"""
        lines = []
        timestamp = metrics.get("timestamp", int(time.time()))
        host = metrics.get("ilo_host", "unknown")
        version = metrics.get("ilo_version", "unknown")
        
        # Base tags
        base_tags = f"host={host},ilo_version={version}"
        
        for key, value in metrics.items():
            if key in ["timestamp", "ilo_host", "ilo_version"]:
                continue
                
            if isinstance(value, dict):
                # Handle nested metrics
                measurement = f"ilo_{key}"
                fields = []
                tags = []
                
                for subkey, subvalue in value.items():
                    if isinstance(subvalue, (int, float)):
                        fields.append(f"{subkey}={subvalue}")
                    elif isinstance(subvalue, str):
                        if subkey in ["status", "health", "state"]:
                            # Convert status to numeric
                            status_map = {
                                "OK": 1, "Good": 1, "Enabled": 1, "On": 1,
                                "Warning": 2, "Degraded": 2,
                                "Critical": 3, "Error": 3, "Failed": 3, "Off": 3,
                                "Unknown": 0, "Absent": 0
                            }
                            numeric_status = status_map.get(subvalue, 0)
                            fields.append(f"{subkey}_numeric={numeric_status}")
                            tags.append(f"{subkey}={subvalue}")
                        else:
                            tags.append(f"{subkey}={subvalue}")
                
                if fields:
                    tag_str = f"{base_tags},{','.join(tags)}" if tags else base_tags
                    field_str = ",".join(fields)
                    lines.append(f"{measurement},{tag_str} {field_str} {timestamp}000000000")
            
            elif isinstance(value, (int, float)):
                lines.append(f"ilo_{key},{base_tags} value={value} {timestamp}000000000")
            elif isinstance(value, str):
                # Convert string values to tags where appropriate
                lines.append(f"ilo_{key},{base_tags},value={value} present=1 {timestamp}000000000")
        
        return "\n".join(lines)

def load_config(config_file: str) -> List[iLOConfig]:
    """Load iLO configurations from JSON file"""
    try:
        with open(config_file, 'r') as f:
            config_data = json.load(f)
        
        configs = []
        for ilo_data in config_data.get("ilo_hosts", []):
            configs.append(iLOConfig(
                hostname=ilo_data.get("hostname", "localhost"),
                username=ilo_data.get("username", ""),
                password=ilo_data.get("password", ""),
                version=str(ilo_data.get("version", "5")),
                port=ilo_data.get("port", 443),
                ssl_verify=ilo_data.get("ssl_verify", False),
                timeout=ilo_data.get("timeout", 30),
                local_mode=ilo_data.get("local_mode", False)
            ))
        
        return configs
    except Exception as e:
        print(f"Error loading config: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="iLO Hardware Monitor for Telegraf")
    parser.add_argument("--config", "-c", default="ilo_config.json",
                       help="Configuration file path")
    parser.add_argument("--host", help="Single iLO hostname to monitor")
    parser.add_argument("--username", "-u", help="iLO username")
    parser.add_argument("--password", "-p", help="iLO password")
    parser.add_argument("--version", "-v", choices=["4", "5"], default="5",
                       help="iLO version (4 or 5)")
    parser.add_argument("--local", action="store_true",
                       help="Monitor local host directly (bypass iLO)")
    parser.add_argument("--output", "-o", choices=["json", "telegraf"], default="telegraf",
                       help="Output format")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    
    args = parser.parse_args()
    
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Local mode
    if args.local:
        config = iLOConfig(
            hostname="localhost",
            username="",
            password="",
            version=args.version,
            local_mode=True
        )
        configs = [config]
    # Single host mode
    elif args.host:
        if not args.username or not args.password:
            print("Username and password required for single host mode (unless using --local)")
            sys.exit(1)
        
        config = iLOConfig(
            hostname=args.host,
            username=args.username,
            password=args.password,
            version=args.version,
            local_mode=False
        )
        configs = [config]
    else:
        # Config file mode
        configs = load_config(args.config)
        if not configs:
            print(f"No valid configurations found in {args.config}")
            sys.exit(1)
    
    # Monitor all configured iLO hosts
    all_outputs = []
    for config in configs:
        monitor = iLOMonitor(config)
        metrics = monitor.collect_all_metrics()
        
        if args.output == "json":
            all_outputs.append(json.dumps(metrics, indent=2))
        else:
            all_outputs.append(monitor.format_for_telegraf(metrics))
    
    # Output results
    for output in all_outputs:
        print(output)
        if len(all_outputs) > 1:
            print()  # Separator between hosts

if __name__ == "__main__":
    main()