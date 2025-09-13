# NetApp CDOT 9.14 MIB File Reference for ServiceNow ITOM

## Overview
This document provides the necessary information for configuring ServiceNow ITOM Event Management to handle NetApp Clustered Data ONTAP (CDOT) 9.14 SNMP traps.

## MIB File Information

### Required MIB Files
1. **Primary MIB**: `NETAPP-MIB.txt` (Main NetApp MIB)
2. **Additional MIBs**: 
   - `RFC1213-MIB.txt` (Standard MIB-II)
   - `SNMPv2-MIB.txt` (SNMPv2 standard)

### Download Source
- **Official NetApp Support Site**: https://mysupport.netapp.com/
- **Path**: Support > Downloads > Software > System Manager/ONTAP
- **File Location**: Under "Management Software" section

## Common NetApp CDOT 9.14 Trap OIDs

### Critical System Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| nvramBatteryLow | 1.3.6.1.4.1.789.0.12 | Major | NVRAM battery is low |
| fanFailure | 1.3.6.1.4.1.789.0.13 | Major | Cooling fan failure |
| powerSupplyFailure | 1.3.6.1.4.1.789.0.14 | Major | Power supply failure |
| diskFailure | 1.3.6.1.4.1.789.0.15 | Major | Disk drive failure |
| temperatureOverheat | 1.3.6.1.4.1.789.0.16 | Critical | System overheating |

### Storage-Specific Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| volumeOffline | 1.3.6.1.4.1.789.0.25 | Major | Volume has gone offline |
| volumeRestricted | 1.3.6.1.4.1.789.0.26 | Minor | Volume is restricted |
| aggregateOffline | 1.3.6.1.4.1.789.0.27 | Major | Aggregate is offline |
| snapmirrorFailure | 1.3.6.1.4.1.789.0.28 | Minor | SnapMirror operation failed |
| quotaExceeded | 1.3.6.1.4.1.789.0.29 | Warning | Quota threshold exceeded |
| waflDirFull | 1.3.6.1.4.1.789.0.187 | Minor | WAFL directory is full |
| maxDirSizeAlert | 1.3.6.1.4.1.789.0.482 | Major | Directory size critical alert |
| maxDirSizeWarning | 1.3.6.1.4.1.789.0.485 | Warning | Directory size warning |

### Network and Cluster Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| clusterNodeDown | 1.3.6.1.4.1.789.0.35 | Major | Cluster node is down |
| interfaceDown | 1.3.6.1.4.1.789.0.36 | Minor | Network interface is down |
| clusterInterconnectDown | 1.3.6.1.4.1.789.0.37 | Major | Cluster interconnect failure |

## Common Varbinds

### Standard Varbinds (Present in most traps)
- **sysUpTime** (1.3.6.1.2.1.1.3.0): System uptime
- **snmpTrapOID** (1.3.6.1.6.3.1.1.4.1.0): Trap OID identifier
- **sysName** (1.3.6.1.2.1.1.5.0): System name/hostname

### NetApp-Specific Varbinds
- **productTrapData** (1.3.6.1.4.1.789.1.2.2.0): Additional trap information
- **productSerialNum** (1.3.6.1.4.1.789.1.1.9.0): System serial number
- **productModel** (1.3.6.1.4.1.789.1.1.5.0): System model
- **productVersion** (1.3.6.1.4.1.789.1.1.2.0): ONTAP version

## Severity Mapping Guidelines

### Critical (1)
- System hardware failures that require immediate attention
- Temperature overheating
- Multiple component failures

### Major (2)
- Single hardware component failures
- Storage subsystem offline
- Cluster node failures

### Minor (3)
- Service degradations
- Non-critical interface failures
- SnapMirror failures

### Warning (4)
- Threshold violations
- Capacity warnings
- Performance alerts

## Notes for ServiceNow Implementation
1. Use the trap OID to determine the specific alert type
2. Parse varbinds for additional context and details
3. Map to Storage-FTS assignment group for all NetApp-related events
4. Include system serial number and model for asset correlation

## NetApp Maxdir Size Events - Special Considerations

### Background
NetApp volumes have a maximum number of files (inodes) that can be stored in a directory. When this limit is approached or reached, it can impact application performance and prevent new file creation.

### Maxdir Size Event Details

### Maxdir Size Event Details

#### Directory Size Warning (OID: 1.3.6.1.4.1.789.0.485)
- **Severity**: Warning (4)
- **Trigger**: Directory approaching size limits or file count thresholds
- **Impact**: Performance may degrade, proactive monitoring needed
- **Action**: Monitor and plan for directory optimization

#### WAFL Directory Full (OID: 1.3.6.1.4.1.789.0.187)
- **Severity**: Minor (3)
- **Trigger**: WAFL directory structure is full
- **Impact**: May affect filesystem operations
- **Action**: Monitor WAFL directory usage and optimize

#### Directory Size Alert (OID: 1.3.6.1.4.1.789.0.482)
- **Severity**: Major (2)
- **Trigger**: Directory has reached critical size limits
- **Impact**: Cannot create new files in directory
- **Action**: Immediate intervention required

### Common Varbinds for Maxdir Events
- **Volume Name**: Directory path and volume information
- **Current File Count**: Number of files in directory
- **Maximum Limit**: Configured maximum file limit
- **Percentage Used**: Current usage percentage

### Resolution Actions
1. **Immediate**: Move files to subdirectories
2. **Short-term**: Increase maxdir limit if possible
3. **Long-term**: Restructure directory hierarchy
4. **Prevention**: Implement file lifecycle management