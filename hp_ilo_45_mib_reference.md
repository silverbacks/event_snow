# HP/HPE iLO 4 and iLO 5 MIB File Reference for ServiceNow ITOM

## Overview
This document provides the necessary information for configuring ServiceNow ITOM Event Management to handle HP/HPE Integrated Lights-Out (iLO) 4 and iLO 5 SNMP traps.

## MIB File Information

### Required MIB Files
1. **Primary MIBs**: 
   - `CPQHOST-MIB.txt` (HP Host MIB)
   - `CPQSINFO-MIB.txt` (HP System Information MIB)
   - `CPQHLTH-MIB.txt` (HP Health MIB)
   - `CPQIDA-MIB.txt` (HP Array Controller MIB)
   - `CPQNIC-MIB.txt` (HP Network Interface MIB)
   - `CPQPOWER-MIB.txt` (HP Power MIB)

2. **Additional MIBs**: 
   - `RFC1213-MIB.txt` (Standard MIB-II)
   - `SNMPv2-MIB.txt` (SNMPv2 standard)

### Download Source
- **HP Enterprise Support**: https://support.hpe.com/
- **Path**: Support > Software Downloads > ProLiant Support Pack
- **Alternative**: HP Systems Insight Manager (SIM) installation media

## HP/HPE Enterprise OID Structure
- **HP Enterprise OID**: `1.3.6.1.4.1.232`
- **HP System Information OID**: `1.3.6.1.4.1.2320` (for CPQSINFO traps)
- **HP Storage Array OIDs**: `1.3.6.1.4.1.232.3.x` (for CPQIDA traps)

## Actual HP/HPE Trap OIDs from MIB Files

### System Information Traps (CPQSINFO-MIB) - Enterprise 2320
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqSiHoodRemoved | 1.3.6.1.4.1.2320.2001 | Warning | Hood/cover removed from system |
| cpqSiMonitorConditionOK | 1.3.6.1.4.1.2320.2002 | Info | Monitor condition returned to OK |
| cpqSiMonitorConditionDegraded | 1.3.6.1.4.1.2320.2003 | Minor | Monitor condition degraded |
| cpqSiMonitorConditionFailed | 1.3.6.1.4.1.2320.2004 | Major | Monitor condition failed |
| cpqSiCorrMemErrStatusDegraded | 1.3.6.1.4.1.2320.2005 | Minor | Correctable memory errors degraded |
| cpqSiCorrMemErrStatusOk | 1.3.6.1.4.1.2320.2006 | Info | Correctable memory errors OK |
| cpqSiMemConfigChange | 1.3.6.1.4.1.2320.2007 | Minor | Memory configuration changed |
| cpqSiHotPlugSlotBoardRemoved | 1.3.6.1.4.1.2320.2008 | Minor | Hot plug slot board removed |
| cpqSiHotPlugSlotBoardInserted | 1.3.6.1.4.1.2320.2009 | Info | Hot plug slot board inserted |
| cpqSiHotPlugSlotPowerUpFailed | 1.3.6.1.4.1.2320.2010 | Major | Hot plug slot power up failed |
| cpqSiSysBatteryFailure | 1.3.6.1.4.1.2320.2011 | Major | System battery failure |
| cpqSiSysBatteryChargingDegraded | 1.3.6.1.4.1.2320.2012 | Minor | System battery charging degraded |
| cpqSiSysBatteryCalibrationError | 1.3.6.1.4.1.2320.2013 | Minor | System battery calibration error |

### Host Management Traps (CPQHOST-MIB) - Enterprise 2320
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqHoGenericTrap | 1.3.6.1.4.1.2320.11001 | Minor | Generic host trap |
| cpqHoAppErrorTrap | 1.3.6.1.4.1.2320.11002 | Minor | Application error trap |
| cpqHo2GenericTrap | 1.3.6.1.4.1.2320.11003 | Minor | Generic host trap V2 |
| cpqHo2AppErrorTrap | 1.3.6.1.4.1.2320.11004 | Minor | Application error trap V2 |
| cpqHo2NicStatusOk | 1.3.6.1.4.1.2320.11005 | Info | NIC status OK |
| cpqHo2NicStatusFailed | 1.3.6.1.4.1.2320.11006 | Major | NIC status failed |
| cpqHo2NicSwitchoverOccurred | 1.3.6.1.4.1.2320.11007 | Minor | NIC switchover occurred |
| cpqHo2NicStatusOk2 | 1.3.6.1.4.1.2320.11008 | Info | NIC status OK V2 |
| cpqHo2NicStatusFailed2 | 1.3.6.1.4.1.2320.11009 | Major | NIC status failed V2 |
| cpqHo2NicSwitchoverOccurred2 | 1.3.6.1.4.1.2320.11010 | Minor | NIC switchover occurred V2 |
| cpqHoProcessEventTrap | 1.3.6.1.4.1.2320.11011 | Minor | Process event trap |
| cpqHoProcessCountWarning | 1.3.6.1.4.1.2320.11012 | Warning | Process count warning |
| cpqHoProcessCountNormal | 1.3.6.1.4.1.2320.11013 | Info | Process count normal |
| cpqHoCriticalSoftwareUpdateTrap | 1.3.6.1.4.1.2320.11014 | Critical | Critical software update |
| cpqHoCrashDumpNotEnabledTrap | 1.3.6.1.4.1.2320.11015 | Warning | Crash dump not enabled |
| cpqHoBootPagingFileTooSmallTrap | 1.3.6.1.4.1.2320.11016 | Warning | Boot paging file too small |
| cpqHoSWRunningStatusChangeTrap | 1.3.6.1.4.1.2320.11017 | Minor | Software running status change |
| cpqHo2PowerThresholdTrap | 1.3.6.1.4.1.2320.11018 | Warning | Power threshold exceeded |
| cpqHoBootPagingFileOrFreeSpaceTooSmallTrap | 1.3.6.1.4.1.2320.11019 | Warning | Boot paging file or free space too small |

### Storage Array Traps (CPQIDA-MIB) - Enterprise 232
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqDaCntlrStatusChange | 1.3.6.1.4.1.232.3.1 | Major | Controller status change |
| cpqDaPhyDrvStatusChange | 1.3.6.1.4.1.232.3.2 | Major | Physical drive status change |
| cpqDaPhyDrvThreshPassedTrap | 1.3.6.1.4.1.232.3.3 | Major | Physical drive threshold passed |
| cpqDaAccelStatusChange | 1.3.6.1.4.1.232.3.4 | Minor | Accelerator status change |
| cpqDaAccelBadDataTrap | 1.3.6.1.4.1.232.3.5 | Minor | Accelerator bad data |
| cpqDaAccelBatteryFailed | 1.3.6.1.4.1.232.3.6 | Major | Accelerator battery failed |
| cpqDaLogDrvStatusChange | 1.3.6.1.4.1.232.3.7 | Major | Logical drive status change |
| cpqDa2SpareStatusChange | 1.3.6.1.4.1.232.3.3001 | Major | Spare drive status change |
| cpqDa2LogDrvStatusChange | 1.3.6.1.4.1.232.3.3002 | Major | Logical drive status change V2 |
| cpqDa2PhyDrvStatusChange | 1.3.6.1.4.1.232.3.3003 | Major | Physical drive status change V2 |
| cpqDa2AccelStatusChange | 1.3.6.1.4.1.232.3.3004 | Minor | Accelerator status change V2 |
| cpqDa2AccelBadDataTrap | 1.3.6.1.4.1.232.3.3005 | Minor | Accelerator bad data V2 |
| cpqDa2AccelBatteryFailed | 1.3.6.1.4.1.232.3.3006 | Major | Accelerator battery failed V2 |
| cpqDa3LogDrvStatusChange | 1.3.6.1.4.1.232.3.3007 | Major | Logical drive status change V3 |
| cpqDa3SpareStatusChange | 1.3.6.1.4.1.232.3.3008 | Major | Spare drive status change V3 |
| cpqDa3PhyDrvStatusChange | 1.3.6.1.4.1.232.3.3009 | Major | Physical drive status change V3 |
| cpqDa3PhyDrvThreshPassedTrap | 1.3.6.1.4.1.232.3.3010 | Major | Physical drive threshold passed V3 |
| cpqDa3AccelStatusChange | 1.3.6.1.4.1.232.3.3011 | Minor | Accelerator status change V3 |

### Memory and Storage Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqHeResMemBoardStatusChange | 1.3.6.1.4.1.232.0.1014 | Major | Memory board status changed |
| cpqDaLogDrvStatusChange | 1.3.6.1.4.1.232.0.3002 | Major | Logical drive status changed |
| cpqDaPhyDrvStatusChange | 1.3.6.1.4.1.232.0.3003 | Major | Physical drive status changed |
| cpqDaAccelStatusChange | 1.3.6.1.4.1.232.0.3004 | Minor | Array controller cache status changed |

### Network Interface Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqNicVtVirusActivity | 1.3.6.1.4.1.232.0.18001 | Warning | Network virus activity detected |
| cpqNicVirusThresholdExceeded | 1.3.6.1.4.1.232.0.18002 | Minor | Network virus threshold exceeded |

### iLO Management Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqSm2ServerReset | 1.3.6.1.4.1.232.0.1007 | Major | Server reset occurred |
| cpqSm2RibsEvLogStatusChange | 1.3.6.1.4.1.232.0.1013 | Minor | iLO event log status changed |
| cpqRackPowerEnclosureTempFailed | 1.3.6.1.4.1.232.0.11001 | Major | Rack power enclosure temperature failed |
| cpqRackPowerSupplyStatusChange | 1.3.6.1.4.1.232.0.11002 | Major | Rack power supply status changed |

### System Event Log (SEL) Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqSeCriticalError | 1.3.6.1.4.1.232.0.6001 | Critical | Critical system error logged |
| cpqSeNonCriticalError | 1.3.6.1.4.1.232.0.6002 | Minor | Non-critical system error logged |

### Power Management Traps
| Trap Name | OID | Severity | Description |
|-----------|-----|----------|-------------|
| cpqPowerMeterStatusChange | 1.3.6.1.4.1.232.0.13001 | Minor | Power meter status changed |
| cpqPowerSupplyStatusChange2 | 1.3.6.1.4.1.232.0.13002 | Major | Power supply status changed (enhanced) |
| cpqPowerConverterStatusChange | 1.3.6.1.4.1.232.0.13003 | Major | Power converter status changed |

## Common Varbinds for HP Traps

### Standard Varbinds (Present in most traps)
- **sysUpTime** (1.3.6.1.2.1.1.3.0): System uptime
- **snmpTrapOID** (1.3.6.1.6.3.1.1.4.1.0): Trap OID identifier
- **sysName** (1.3.6.1.2.1.1.5.0): System name/hostname
- **sysDescr** (1.3.6.1.2.1.1.1.0): System description

### HP-Specific Varbinds (from actual MIB files)
- **cpqHoSWRunningTime** (1.3.6.1.4.1.232.11.2.10.1.0): Software running time
- **cpqHoSystemStatus** (1.3.6.1.4.1.232.11.2.10.4.0): Overall system status
- **cpqSerialNum** (1.3.6.1.4.1.232.11.2.16.4): System serial number
- **cpqServerUUID** (1.3.6.1.4.1.232.11.2.16.5): Server UUID
- **cpqSiProductName** (1.3.6.1.4.1.232.2.2.4.2): Product name
- **cpqSiServerSystemId** (1.3.6.1.4.1.232.2.2.4.17): Server system ID
- **cpqSiSysSerialNum** (1.3.6.1.4.1.232.2.2.2.1): System serial number (alternative)
- **cpqSiMemECCCondition** (1.3.6.1.4.1.232.2.2.4.15): Memory ECC condition
- **cpqSiMonitorOverallCondition** (1.3.6.1.4.1.232.2.2.8.1): Monitor overall condition
- **cpqSiSystemBatteryOverallCondition** (1.3.6.1.4.1.232.2.2.10.1): System battery overall condition
- **cpqSiHotPlugSlotCondition** (1.3.6.1.4.1.232.2.2.9.2): Hot plug slot condition

### Storage Array Component Varbinds (from CPQIDA-MIB)
- **cpqDaLogDrvStatus** (1.3.6.1.4.1.232.3.2.3.1.1.4): Logical drive status
- **cpqDaPhyDrvStatus** (1.3.6.1.4.1.232.3.2.5.1.1.6): Physical drive status
- **cpqDaAccelStatus** (1.3.6.1.4.1.232.3.2.2.1.1.9): Accelerator status
- **cpqDaSpareStatus** (1.3.6.1.4.1.232.3.2.4.1.1.3): Spare drive status
- **cpqDaPhyDrvBusNumber** (1.3.6.1.4.1.232.3.2.5.1.1.2): Physical drive bus number
- **cpqDaAccelBattery** (1.3.6.1.4.1.232.3.2.2.1.1.6): Accelerator battery status
- **cpqDaAccelBadData** (1.3.6.1.4.1.232.3.2.2.1.1.7): Accelerator bad data status
- **cpqHeFltTolPowerSupplyStatus** (1.3.6.1.4.1.232.6.2.9.3.1.4): Power supply status
- **cpqHeFltTolFanStatus** (1.3.6.1.4.1.232.6.2.6.7.1.9): Fan status
- **cpqHeTemperatureStatus** (1.3.6.1.4.1.232.6.2.6.8.1.6): Temperature status
- **cpqHeCorrMemErrTotalErrs** (1.3.6.1.4.1.232.6.2.5.4.1.7): Total correctable memory errors

### Storage Array Varbinds
- **cpqDaLogDrvStatus** (1.3.6.1.4.1.232.3.2.3.1.1.4): Logical drive status
- **cpqDaPhyDrvStatus** (1.3.6.1.4.1.232.3.2.5.1.1.6): Physical drive status
- **cpqDaCntlrCurrentRole** (1.3.6.1.4.1.232.3.2.2.1.1.9): Controller current role

## Status Code Mappings

### General Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | other | 3 (Minor) | Unknown or other status |
| 2 | ok | 5 (Info) | Component operating normally |
| 3 | degraded | 4 (Warning) | Component degraded but functional |
| 4 | failed | 2 (Major) | Component has failed |
| 5 | missing | 3 (Minor) | Component is missing |

### Power Supply Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | noError | 5 (Info) | Power supply operating normally |
| 2 | generalFailure | 2 (Major) | General power supply failure |
| 3 | bistFailure | 2 (Major) | Built-in self-test failure |
| 4 | fanFailure | 2 (Major) | Power supply fan failure |
| 5 | tempFailure | 1 (Critical) | Power supply temperature failure |
| 6 | interlockOpen | 3 (Minor) | Power supply interlock open |

### Fan Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | other | 3 (Minor) | Fan status unknown |
| 2 | ok | 5 (Info) | Fan operating normally |
| 3 | degraded | 4 (Warning) | Fan degraded performance |
| 4 | failed | 2 (Major) | Fan has failed |

### Temperature Status Codes
| Code | Status | ServiceNow Severity | Description |
|------|--------|-------------------|-------------|
| 1 | other | 3 (Minor) | Temperature status unknown |
| 2 | ok | 5 (Info) | Temperature normal |
| 3 | degraded | 4 (Warning) | Temperature warning threshold |
| 4 | failed | 1 (Critical) | Temperature critical threshold |

## iLO Version Differences

### iLO 4 Specific Features
- Integrated Remote Console
- Virtual Media support
- Power management capabilities
- Basic SNMP v1/v2c support

### iLO 5 Enhanced Features
- Advanced secure boot
- Enhanced security features
- Improved power management
- SNMPv3 support with enhanced encryption
- More granular hardware monitoring

## Severity Mapping Guidelines

### Critical (1)
- Processor failures
- Temperature critical thresholds
- Multiple component failures
- System boot failures

### Major (2)
- Single hardware component failures
- Power supply failures
- Storage controller failures
- Memory failures

### Minor (3)
- Component degradations
- Cache battery issues
- Non-critical sensor alerts
- Missing components

### Warning (4)
- Performance degradations
- Temperature warnings
- Capacity warnings
- Predictive failure alerts

### Info (5)
- Normal status changes
- Informational events
- Routine status updates

## Notes for ServiceNow Implementation
1. **Two HP Enterprise OID ranges**: 
   - Standard HP traps use `1.3.6.1.4.1.232` (with various sub-branches)
   - System Information and Host Management traps use `1.3.6.1.4.1.2320`
2. Use trap OID to determine specific hardware component and issue type
3. Parse status code varbinds to determine appropriate severity
4. Include system serial number and product name for asset correlation
5. **Assignment groups based on trap category**:
   - **Hardware-Server-Support**: General hardware issues (CPU, memory, power, cooling)
   - **Storage-Support**: Storage array-related issues (drives, controllers)
   - **Network-Support**: Network interface issues (NIC failures, virus detection)
   - **Server-Management**: System management issues (iLO, host events)
6. **Enterprise OID Detection**: Update condition scripts to check for both `232` and `2320` enterprise ranges
7. **Trap versioning**: Many traps have V2 and V3 versions with enhanced varbinds
8. **Component status parsing**: Extract status codes from component-specific varbinds for accurate severity mapping
   - Network-Support (network interface issues)