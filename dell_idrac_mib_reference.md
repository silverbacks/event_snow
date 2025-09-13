# Dell iDRAC MIB File Reference for ServiceNow ITOM

## Overview
This document provides the necessary information for configuring ServiceNow ITOM Event Management to handle Dell iDRAC (Integrated Dell Remote Access Controller) SNMP traps.

## MIB File Information

### Required MIB Files
1. **Primary MIBs**: 
   - `IDRAC-MIB-SMIv2.txt` (Dell iDRAC specific MIB)
   - `Dell-OM-MIB.txt` (Dell OpenManage Server Administrator MIB)
   - `10892.txt` (Dell Enterprise MIB)

2. **Additional MIBs**: 
   - `RFC1213-MIB.txt` (Standard MIB-II)
   - `SNMPv2-MIB.txt` (SNMPv2 standard)

### Download Source
- **Dell Support**: https://www.dell.com/support/
- **Path**: Support > Drivers & Downloads > Search for your server model
- **Alternative**: Dell OpenManage Server Administrator installation media

## Dell Enterprise OID Structure
- **Dell Enterprise OID**: `1.3.6.1.4.1.674`
- **Server Administrator OID**: `1.3.6.1.4.1.674.10892.1`
- **iDRAC Specific OID**: `1.3.6.1.4.1.674.10892.5`
- **OM Essentials OID**: `1.3.6.1.4.1.674.11000.1000.100` (Primary trap source)

## Dell OM Essentials Trap OIDs (PRIMARY)

These are the **actual trap OIDs** from the MIB-Dell-OME.mib file:

### System Status Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| OME Test Alert | 1.3.6.1.4.1.674.11000.1000.100.1.1 | Info | Test alert forwarded from OM Essentials |
| OME System Up | 1.3.6.1.4.1.674.11000.1000.100.1.1000 | Info | System up message - device online |
| OME System Down | 1.3.6.1.4.1.674.11000.1000.100.1.1001 | Critical | System down message - device offline |
| OME Forwarded Alert | 1.3.6.1.4.1.674.11000.1000.100.1.2000 | Info | Forwarded alert from OM Essentials |
| OME Unknown Status | 1.3.6.1.4.1.674.11000.1000.100.1.3001 | Minor | Device status unknown |
| OME Normal Status | 1.3.6.1.4.1.674.11000.1000.100.1.3002 | Info | Device status normal |
| OME Warning Status | 1.3.6.1.4.1.674.11000.1000.100.1.3003 | Warning | Device status warning |
| OME Critical Status | 1.3.6.1.4.1.674.11000.1000.100.1.3004 | Critical | Device status critical |

## Dell iDRAC Trap OIDs (LEGACY/THEORETICAL)

### Critical System Hardware Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| Server Power Off | 1.3.6.1.4.1.674.10892.1.0.1001 | Critical | Server has been powered off |
| System Board Failure | 1.3.6.1.4.1.674.10892.1.0.1004 | Critical | System board hardware failure |
| Temperature Critical | 1.3.6.1.4.1.674.10892.1.0.1052 | Critical | Temperature exceeded critical threshold |
| Power Supply Critical Failure | 1.3.6.1.4.1.674.10892.1.0.1106 | Critical | Power supply critical failure |
| CPU Critical Error | 1.3.6.1.4.1.674.10892.1.0.1153 | Critical | CPU critical error detected |
| Memory Critical Error | 1.3.6.1.4.1.674.10892.1.0.1202 | Critical | Memory critical error |
| Storage Controller Failure | 1.3.6.1.4.1.674.10892.1.0.1304 | Critical | Storage controller failure |
| Physical Disk Failure | 1.3.6.1.4.1.674.10892.1.0.1403 | Critical | Physical disk failure |

### Major Severity Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| Server Power On | 1.3.6.1.4.1.674.10892.1.0.1002 | Major | Server has been powered on |
| Server Reset | 1.3.6.1.4.1.674.10892.1.0.1003 | Major | Server has been reset |
| Temperature Warning | 1.3.6.1.4.1.674.10892.1.0.1051 | Major | Temperature warning threshold |
| Power Supply Failure | 1.3.6.1.4.1.674.10892.1.0.1105 | Major | Power supply failure |
| Power Redundancy Lost | 1.3.6.1.4.1.674.10892.1.0.1107 | Major | Power redundancy lost |
| CPU Status Change | 1.3.6.1.4.1.674.10892.1.0.1151 | Major | CPU status changed |
| CPU Throttling | 1.3.6.1.4.1.674.10892.1.0.1152 | Major | CPU throttling activated |
| Memory Error Corrected | 1.3.6.1.4.1.674.10892.1.0.1201 | Major | Correctable memory error |
| Memory Device Status Change | 1.3.6.1.4.1.674.10892.1.0.1203 | Major | Memory device status changed |
| Fan Failure | 1.3.6.1.4.1.674.10892.1.0.1251 | Major | Fan failure detected |
| Fan Speed Change | 1.3.6.1.4.1.674.10892.1.0.1252 | Major | Fan speed changed |
| Storage Controller Status Change | 1.3.6.1.4.1.674.10892.1.0.1301 | Major | Storage controller status change |
| Virtual Disk Status Change | 1.3.6.1.4.1.674.10892.1.0.1302 | Major | Virtual disk status change |
| Physical Disk Status Change | 1.3.6.1.4.1.674.10892.1.0.1401 | Major | Physical disk status change |
| Physical Disk Rebuild | 1.3.6.1.4.1.674.10892.1.0.1402 | Major | Physical disk rebuild started |
| Network Interface Down | 1.3.6.1.4.1.674.10892.1.0.1451 | Major | Network interface down |

### iDRAC Management Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| iDRAC Service Tag Changed | 1.3.6.1.4.1.674.10892.5.0.2001 | Major | Service tag changed |
| iDRAC Configuration Changed | 1.3.6.1.4.1.674.10892.5.0.2002 | Minor | Configuration changed |
| iDRAC User Authentication Failed | 1.3.6.1.4.1.674.10892.5.0.2003 | Major | Authentication failure |
| iDRAC User Login | 1.3.6.1.4.1.674.10892.5.0.2004 | Minor | User login successful |
| iDRAC User Logout | 1.3.6.1.4.1.674.10892.5.0.2005 | Minor | User logout |
| iDRAC Firmware Update | 1.3.6.1.4.1.674.10892.5.0.2006 | Major | Firmware update |
| iDRAC Communication Lost | 1.3.6.1.4.1.674.10892.5.0.2007 | Critical | Communication lost |

### Warning and Info Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| System Performance Degraded | 1.3.6.1.4.1.674.10892.1.0.1501 | Warning | Performance degraded |
| Intrusion Detection | 1.3.6.1.4.1.674.10892.1.0.1502 | Warning | Chassis intrusion detected |
| System Event Log Full | 1.3.6.1.4.1.674.10892.1.0.1503 | Warning | Event log full |
| System Boot Complete | 1.3.6.1.4.1.674.10892.1.0.1601 | Info | Boot completed successfully |
| System Inventory Update | 1.3.6.1.4.1.674.10892.1.0.1602 | Info | Inventory updated |

## Common Varbinds for Dell OME Traps (PRIMARY)

### OM Essentials Varbinds (from MIB-Dell-OME.mib)
- **omeAlertMessage**: `1.3.6.1.4.1.674.11000.1000.100.1.1` (Message in the alert)
- **omeAlertDevice**: `1.3.6.1.4.1.674.11000.1000.100.1.2` (Name of device where alert originated)
- **omeAlertSeverity**: `1.3.6.1.4.1.674.11000.1000.100.1.3` (Original severity of the alert)

### OpenManage Alert Variables (from MIB-Dell-10892.mib)
- **alertSystem**: `1.3.6.1.4.1.674.10892.1.5000.10.1` (Name of system generating alert)
- **alertTableIndexOID**: `1.3.6.1.4.1.674.10892.1.5000.10.2` (OID for index in table)
- **alertMessage**: `1.3.6.1.4.1.674.10892.1.5000.10.3` (Message describing the alert)
- **alertCurrentStatus**: `1.3.6.1.4.1.674.10892.1.5000.10.4` (Current status)

## Common Varbinds for Dell Legacy Traps

### Standard Varbinds (Present in most traps)
- **sysUpTime** (1.3.6.1.2.1.1.3.0): System uptime
- **snmpTrapOID** (1.3.6.1.6.3.1.1.4.1.0): Trap OID identifier
- **sysName** (1.3.6.1.2.1.1.5.0): System name/hostname
- **sysDescr** (1.3.6.1.2.1.1.1.0): System description

### Dell-Specific Varbinds
- **systemStatus** (1.3.6.1.4.1.674.10892.1.200.10.1.2.1): Overall system status
- **systemServiceTag** (1.3.6.1.4.1.674.10892.1.300.10.1.11.1): Service tag
- **systemExpressServiceCode** (1.3.6.1.4.1.674.10892.1.300.10.1.12.1): Express service code
- **systemModelName** (1.3.6.1.4.1.674.10892.1.300.10.1.9.1): Model name
- **systemBIOSVersion** (1.3.6.1.4.1.674.10892.1.300.10.1.5.1): BIOS version

### Hardware Component Varbinds
- **temperatureStatus** (1.3.6.1.4.1.674.10892.1.700.20.1.5.1): Temperature probe status
- **temperatureReading** (1.3.6.1.4.1.674.10892.1.700.20.1.6.1): Temperature reading
- **fanStatus** (1.3.6.1.4.1.674.10892.1.700.12.1.5.1): Fan status
- **fanSpeed** (1.3.6.1.4.1.674.10892.1.700.12.1.6.1): Fan speed reading
- **powerSupplyStatus** (1.3.6.1.4.1.674.10892.1.600.12.1.5.1): Power supply status
- **powerSupplyType** (1.3.6.1.4.1.674.10892.1.600.12.1.7.1): Power supply type

### Memory Component Varbinds
- **memoryDeviceStatus** (1.3.6.1.4.1.674.10892.1.1100.50.1.5.1): Memory device status
- **memoryDeviceSize** (1.3.6.1.4.1.674.10892.1.1100.50.1.14.1): Memory size
- **memoryDeviceType** (1.3.6.1.4.1.674.10892.1.1100.50.1.7.1): Memory type

### Storage Component Varbinds
- **virtualDiskStatus** (1.3.6.1.4.1.674.10892.1.1400.10.1.4.1): Virtual disk status
- **physicalDiskStatus** (1.3.6.1.4.1.674.10892.1.1400.20.1.4.1): Physical disk status
- **controllerStatus** (1.3.6.1.4.1.674.10892.1.1400.10.1.4.1): Controller status

### iDRAC Specific Varbinds
- **idracVersion** (1.3.6.1.4.1.674.10892.5.1.1.6.0): iDRAC firmware version
- **idracURL** (1.3.6.1.4.1.674.10892.5.1.1.5.0): iDRAC web interface URL

## Status Code Mappings

### General Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | Other | 3 (Minor) | Unknown or other status |
| 2 | Unknown | 3 (Minor) | Status unknown |
| 3 | OK | 5 (Info) | Component operating normally |
| 4 | Non-Critical | 4 (Warning) | Component degraded but functional |
| 5 | Critical | 1 (Critical) | Component has failed critically |
| 6 | Non-Recoverable | 1 (Critical) | Component failure non-recoverable |

### Power Supply Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | Other | 3 (Minor) | Other status |
| 2 | Unknown | 3 (Minor) | Unknown status |
| 3 | OK | 5 (Info) | Power supply operating normally |
| 4 | Non-Critical | 4 (Warning) | Non-critical issue |
| 5 | Critical | 1 (Critical) | Critical failure |
| 6 | Non-Recoverable | 1 (Critical) | Non-recoverable failure |
| 7 | AC Lost | 2 (Major) | AC power lost |
| 8 | AC Lost or Out of Range | 2 (Major) | AC lost or out of range |
| 9 | AC Out of Range but Present | 4 (Warning) | AC out of range |
| 10 | Configuration Error | 2 (Major) | Configuration error |

### Temperature Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | Other | 3 (Minor) | Other status |
| 2 | Unknown | 3 (Minor) | Unknown status |
| 3 | OK | 5 (Info) | Temperature normal |
| 4 | Non-Critical Upper | 4 (Warning) | Upper warning threshold |
| 5 | Critical Upper | 1 (Critical) | Upper critical threshold |
| 6 | Non-Recoverable Upper | 1 (Critical) | Upper non-recoverable |
| 7 | Non-Critical Lower | 4 (Warning) | Lower warning threshold |
| 8 | Critical Lower | 1 (Critical) | Lower critical threshold |
| 9 | Non-Recoverable Lower | 1 (Critical) | Lower non-recoverable |
| 10 | Failed | 2 (Major) | Sensor failed |

## iDRAC Version Differences

### iDRAC 7 (13th Generation)
- Basic remote management
- Virtual console and media
- SNMP v1/v2c support
- Basic hardware monitoring

### iDRAC 8 (14th Generation)
- Enhanced security features
- Improved virtual console
- SNMP v3 support
- Advanced power management

### iDRAC 9 (15th Generation)
- Modern web interface
- RESTful API support
- Enhanced security (FIPS compliance)
- Advanced telemetry and analytics

### iDRAC 10 (Current Generation)
- Cloud integration capabilities
- Advanced AI-driven insights
- Enhanced security features
- Improved automation APIs

## Dell Server Model Identification

### 13th Generation (iDRAC 7/8)
- PowerEdge R730, R630, R530
- PowerEdge R720, R620, R520
- PowerEdge T730, T630, T430

### 14th Generation (iDRAC 8/9)
- PowerEdge R740, R640, R540
- PowerEdge R7415, R6415, R5415
- PowerEdge T740, T640, T440

### 15th Generation (iDRAC 9/10)
- PowerEdge R750, R650, R550
- PowerEdge R7525, R6525, R5525
- PowerEdge T750, T650, T550

## Severity Mapping Guidelines

### Critical (1)
- System power failures
- CPU critical errors
- Memory critical errors
- Storage controller failures
- Temperature critical thresholds

### Major (2)
- Component failures affecting functionality
- Power supply failures
- Storage device failures
- Network interface failures
- Security events

### Minor (3)
- Component status changes
- Configuration changes
- Non-critical alerts
- Informational status updates

### Warning (4)
- Performance degradations
- Warning thresholds
- Intrusion detection
- Log file issues

### Info (5)
- Normal status changes
- System boot events
- Inventory updates
- Routine operations

## Hostname Cleaning Patterns

The Dell iDRAC trap handler automatically removes common suffixes:
- `-idrac` (hostname-idrac)
- `-drac` (hostname-drac)
- `-ipmi` (hostname-ipmi)
- `-mgmt` (hostname-mgmt)
- `-bmc` (hostname-bmc)
- `-oob` (hostname-oob)
- `-mgt` (hostname-mgt)
- `r` (hostnamer)
- `-r` (hostname-r)

## Notes for ServiceNow Implementation

1. **Enterprise OID Detection**: Dell uses `1.3.6.1.4.1.674` as the enterprise OID
2. **Service Tag Correlation**: Use Dell service tag for asset correlation in CMDB
3. **Assignment Groups**: Route based on component category:
   - **Storage-Support**: Storage array and disk events
   - **Network-Support**: Network interface events
   - **Server-Management**: iDRAC and management events
   - **Hardware-Server-Support**: General hardware events
4. **Custom Fields**: Extract service tag, express service code, model, and iDRAC info
5. **Version Detection**: Determine iDRAC version from firmware or model information
6. **Status Code Analysis**: Parse component-specific status codes for accurate severity
7. **Correlation**: Group events by hostname and component type for better incident management

## Security Considerations

### SNMP Security
- Use SNMPv3 where supported (iDRAC 8+)
- Secure community strings for SNMPv2c
- Restrict SNMP access by source IP
- Regular credential rotation

### iDRAC Security
- Enable secure protocols (HTTPS, SSH)
- Use strong authentication
- Regular firmware updates
- Network segmentation for management interfaces

This implementation provides comprehensive Dell iDRAC SNMP trap handling with intelligent hostname extraction, component-based routing, and proper severity mapping for ServiceNow ITOM integration.