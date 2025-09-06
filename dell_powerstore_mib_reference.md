# Dell PowerStore MIB File Reference for ServiceNow ITOM

## Overview
This document provides the necessary information for configuring ServiceNow ITOM Event Management to handle Dell PowerStore SNMP traps for storage array monitoring and management.

## MIB File Information

### Required MIB Files
1. **Primary MIBs**: 
   - `DELL-POWERSTORE-MIB.txt` (Dell PowerStore specific MIB)
   - `DELL-STORAGE-MIB.txt` (Dell Storage Management MIB)
   - `MIB-Dell-10893.mib` (Dell Storage Enterprise MIB)

2. **Additional MIBs**: 
   - `RFC1213-MIB.txt` (Standard MIB-II)
   - `SNMPv2-MIB.txt` (SNMPv2 standard)

### Download Source
- **Dell Support**: https://www.dell.com/support/
- **PowerStore Documentation**: Dell PowerStore Administrator Guide
- **Alternative**: Dell PowerStore Manager installation media

## Dell Enterprise OID Structure
- **Dell Enterprise OID**: `1.3.6.1.4.1.674`
- **PowerStore Specific OID**: `1.3.6.1.4.1.674.11000.2000`
- **Dell Storage OID**: `1.3.6.1.4.1.674.10893`

## Dell PowerStore Trap OIDs

### Critical Severity Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| PowerStore Array Offline | 1.3.6.1.4.1.674.11000.2000.100.1001 | Critical | Storage array is offline |
| PowerStore Volume Offline | 1.3.6.1.4.1.674.11000.2000.100.1002 | Critical | Volume is offline |
| PowerStore Drive Failed | 1.3.6.1.4.1.674.11000.2000.100.1003 | Critical | Drive failure detected |
| PowerStore Node Failed | 1.3.6.1.4.1.674.11000.2000.100.1004 | Critical | Node failure |
| PowerStore Protection Policy Failed | 1.3.6.1.4.1.674.11000.2000.100.1005 | Critical | Protection policy failure |
| PowerStore Replication Failed | 1.3.6.1.4.1.674.11000.2000.100.1006 | Critical | Replication failure |
| PowerStore Cluster Degraded | 1.3.6.1.4.1.674.11000.2000.100.1007 | Critical | Cluster in degraded state |
| PowerStore Power Supply Critical | 1.3.6.1.4.1.674.11000.2000.100.1008 | Critical | Power supply critical failure |
| PowerStore Temperature Critical | 1.3.6.1.4.1.674.11000.2000.100.1009 | Critical | Temperature critical threshold |
| PowerStore Fan Critical | 1.3.6.1.4.1.674.11000.2000.100.1010 | Critical | Fan critical failure |

### Major Severity Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| PowerStore Volume Performance Degraded | 1.3.6.1.4.1.674.11000.2000.100.2001 | Major | Volume performance degraded |
| PowerStore Host Connectivity Issue | 1.3.6.1.4.1.674.11000.2000.100.2002 | Major | Host connectivity problem |
| PowerStore Drive Predictive Failure | 1.3.6.1.4.1.674.11000.2000.100.2003 | Major | Drive predictive failure |
| PowerStore Space Low Warning | 1.3.6.1.4.1.674.11000.2000.100.2004 | Major | Storage space low |
| PowerStore Snapshot Policy Warning | 1.3.6.1.4.1.674.11000.2000.100.2005 | Major | Snapshot policy issue |
| PowerStore Backup Job Failed | 1.3.6.1.4.1.674.11000.2000.100.2006 | Major | Backup job failure |
| PowerStore Network Port Down | 1.3.6.1.4.1.674.11000.2000.100.2007 | Major | Network port down |
| PowerStore Power Redundancy Lost | 1.3.6.1.4.1.674.11000.2000.100.2008 | Major | Power redundancy lost |
| PowerStore Temperature Warning | 1.3.6.1.4.1.674.11000.2000.100.2009 | Major | Temperature warning |
| PowerStore Certificate Expiring | 1.3.6.1.4.1.674.11000.2000.100.2010 | Major | Certificate expiration warning |

### Minor Severity Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| PowerStore Volume Created | 1.3.6.1.4.1.674.11000.2000.100.3001 | Minor | Volume created |
| PowerStore Volume Modified | 1.3.6.1.4.1.674.11000.2000.100.3002 | Minor | Volume configuration changed |
| PowerStore Host Added | 1.3.6.1.4.1.674.11000.2000.100.3003 | Minor | Host added to system |
| PowerStore Snapshot Created | 1.3.6.1.4.1.674.11000.2000.100.3004 | Minor | Snapshot created |
| PowerStore Drive Inserted | 1.3.6.1.4.1.674.11000.2000.100.3005 | Minor | Drive inserted |
| PowerStore Node Status Change | 1.3.6.1.4.1.674.11000.2000.100.3006 | Minor | Node status change |
| PowerStore Protection Policy Modified | 1.3.6.1.4.1.674.11000.2000.100.3007 | Minor | Protection policy modified |
| PowerStore User Login | 1.3.6.1.4.1.674.11000.2000.100.3008 | Minor | User login event |
| PowerStore Configuration Change | 1.3.6.1.4.1.674.11000.2000.100.3009 | Minor | Configuration change |
| PowerStore Firmware Update | 1.3.6.1.4.1.674.11000.2000.100.3010 | Minor | Firmware update |

### Warning Severity Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| PowerStore Space Usage High | 1.3.6.1.4.1.674.11000.2000.100.4001 | Warning | Space usage high |
| PowerStore IOPS Threshold Exceeded | 1.3.6.1.4.1.674.11000.2000.100.4002 | Warning | IOPS threshold exceeded |
| PowerStore Bandwidth Threshold Exceeded | 1.3.6.1.4.1.674.11000.2000.100.4003 | Warning | Bandwidth threshold exceeded |
| PowerStore Latency High | 1.3.6.1.4.1.674.11000.2000.100.4004 | Warning | High latency detected |
| PowerStore License Expiring | 1.3.6.1.4.1.674.11000.2000.100.4005 | Warning | License expiring |

### Info Severity Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| PowerStore Array Online | 1.3.6.1.4.1.674.11000.2000.100.5001 | Info | Array online |
| PowerStore Volume Online | 1.3.6.1.4.1.674.11000.2000.100.5002 | Info | Volume online |
| PowerStore Replication Synchronized | 1.3.6.1.4.1.674.11000.2000.100.5003 | Info | Replication synchronized |
| PowerStore Backup Completed | 1.3.6.1.4.1.674.11000.2000.100.5004 | Info | Backup completed |
| PowerStore Performance Normal | 1.3.6.1.4.1.674.11000.2000.100.5005 | Info | Performance normal |
| PowerStore Health Check Passed | 1.3.6.1.4.1.674.11000.2000.100.5006 | Info | Health check passed |

## Common Varbinds for Dell PowerStore Traps

### Standard Varbinds (Present in most traps)
- **sysUpTime** (1.3.6.1.2.1.1.3.0): System uptime
- **snmpTrapOID** (1.3.6.1.6.3.1.1.4.1.0): Trap OID identifier
- **sysName** (1.3.6.1.2.1.1.5.0): System name/hostname
- **sysDescr** (1.3.6.1.2.1.1.1.0): System description

### PowerStore-Specific Varbinds
- **arraySerialNumber** (1.3.6.1.4.1.674.11000.2000.10.1.1): Array serial number
- **arrayModel** (1.3.6.1.4.1.674.11000.2000.10.1.2): Array model
- **arrayName** (1.3.6.1.4.1.674.11000.2000.10.1.3): Array name
- **softwareVersion** (1.3.6.1.4.1.674.11000.2000.10.1.4): Software version
- **managementIP** (1.3.6.1.4.1.674.11000.2000.10.1.5): Management IP address

### Cluster Information Varbinds
- **clusterName** (1.3.6.1.4.1.674.11000.2000.20.1.1): Cluster name
- **clusterState** (1.3.6.1.4.1.674.11000.2000.20.1.2): Cluster state
- **nodeCount** (1.3.6.1.4.1.674.11000.2000.20.1.3): Number of nodes
- **masterNode** (1.3.6.1.4.1.674.11000.2000.20.1.4): Master node identifier

### Storage Information Varbinds
- **volumeName** (1.3.6.1.4.1.674.11000.2000.30.1.1): Volume name
- **volumeSize** (1.3.6.1.4.1.674.11000.2000.30.1.2): Volume size
- **volumeState** (1.3.6.1.4.1.674.11000.2000.30.1.3): Volume state
- **usedSpace** (1.3.6.1.4.1.674.11000.2000.30.1.4): Used space
- **freeSpace** (1.3.6.1.4.1.674.11000.2000.30.1.5): Free space

### Performance Varbinds
- **iopsRead** (1.3.6.1.4.1.674.11000.2000.40.1.1): Read IOPS
- **iopsWrite** (1.3.6.1.4.1.674.11000.2000.40.1.2): Write IOPS
- **bandwidthRead** (1.3.6.1.4.1.674.11000.2000.40.1.3): Read bandwidth
- **bandwidthWrite** (1.3.6.1.4.1.674.11000.2000.40.1.4): Write bandwidth
- **latencyRead** (1.3.6.1.4.1.674.11000.2000.40.1.5): Read latency
- **latencyWrite** (1.3.6.1.4.1.674.11000.2000.40.1.6): Write latency

## Status Code Mappings

### General Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | OK | 5 (Info) | Component operating normally |
| 2 | Warning | 4 (Warning) | Component has warning condition |
| 3 | Error | 1 (Critical) | Component has error condition |
| 4 | Critical | 1 (Critical) | Component has critical failure |
| 5 | Unknown | 3 (Minor) | Component status unknown |

### Volume State Codes
| Code | State | ServiceNow Severity | Description |
|------|-------|-------------------|-------------|
| 1 | Online | 5 (Info) | Volume is online and accessible |
| 2 | Offline | 1 (Critical) | Volume is offline |
| 3 | Degraded | 2 (Major) | Volume is degraded but accessible |
| 4 | Maintenance | 3 (Minor) | Volume in maintenance mode |
| 5 | Unknown | 3 (Minor) | Volume state unknown |

### Cluster State Codes
| Code | State | ServiceNow Severity | Description |
|------|-------|-------------------|-------------|
| 1 | Normal | 5 (Info) | Cluster operating normally |
| 2 | Degraded | 2 (Major) | Cluster degraded but functional |
| 3 | Failed | 1 (Critical) | Cluster has failed |
| 4 | Maintenance | 3 (Minor) | Cluster in maintenance mode |
| 5 | Unknown | 3 (Minor) | Cluster state unknown |

## PowerStore Model Identification

### PowerStore T Models (All-Flash NVMe)
- PowerStore 1000T
- PowerStore 3000T
- PowerStore 5000T
- PowerStore 7000T
- PowerStore 9000T

### PowerStore X Models (Hybrid)
- PowerStore 1000X
- PowerStore 3000X
- PowerStore 5000X
- PowerStore 7000X
- PowerStore 9000X

## Severity Mapping Guidelines

### Critical (1)
- Array offline conditions
- Volume failures
- Node failures
- Cluster failures
- Critical hardware failures

### Major (2)
- Performance degradation
- Connectivity issues
- Drive predictive failures
- Space warnings
- Backup failures

### Minor (3)
- Configuration changes
- Status changes
- Object creation/modification
- User activities

### Warning (4)
- Threshold exceeded alerts
- License expiration warnings
- Capacity warnings
- Performance warnings

### Info (5)
- Normal operations
- Health checks
- Backup completions
- Synchronization events

## Hostname Cleaning Patterns

The Dell PowerStore trap handler automatically removes common suffixes:
- `-powerstore` (hostname-powerstore)
- `-ps` (hostname-ps)
- `-storage` (hostname-storage)
- `-mgmt` (hostname-mgmt)
- `-cluster` (hostname-cluster)
- `-node1`, `-node2` (hostname-node1)
- `-array` (hostname-array)
- `-san` (hostname-san)

## Notes for ServiceNow Implementation

1. **Enterprise OID Detection**: PowerStore uses `1.3.6.1.4.1.674.11000.2000` as the primary OID
2. **Array Serial Correlation**: Use PowerStore array serial for asset correlation in CMDB
3. **Assignment Groups**: Route based on component category:
   - **Storage-Support**: Storage, capacity, replication events
   - **Network-Support**: Host connectivity and network events
   - **Storage-Performance**: Performance-related events
   - **Storage-Management**: Management and security events
4. **Custom Fields**: Extract array serial, model, cluster name, and volume information
5. **Performance Monitoring**: Capture IOPS, bandwidth, and latency metrics
6. **Correlation**: Group events by array and component type for better incident management

## Security Considerations

### SNMP Security
- Use SNMPv3 where supported
- Secure community strings for SNMPv2c
- Restrict SNMP access by source IP
- Regular credential rotation

### PowerStore Security
- Enable secure protocols (HTTPS, SSH)
- Use strong authentication
- Regular firmware updates
- Network segmentation for management interfaces

This implementation provides comprehensive Dell PowerStore SNMP trap handling with intelligent hostname extraction, component-based routing, and proper severity mapping for ServiceNow ITOM integration.