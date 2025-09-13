# Dell/EMC PowerStore MIB-Based Severity Determination

## Overview
Updated the Dell/EMC storage trap handler to use actual PowerStore MIB structure for severity determination and trap object extraction, based on the official PowerStore-MIB definitions.

## PowerStore MIB Structure

### 🎯 **Trap OID Hierarchy**
Based on actual PowerStore-MIB from Dell Support:

```
Enterprise OID: 1.3.6.1.4.1.1139 (EMC Corporation - Dell)
PowerStore Branch: 1.3.6.1.4.1.1139.205

Trap Hierarchy:
├── powerstoreGenericTrapCritical → 1.3.6.1.4.1.1139.205.1.2.1 (Severity 1)
├── powerstoreGenericTrapMajor    → 1.3.6.1.4.1.1139.205.1.2.2 (Severity 2)  
├── powerstoreGenericTrapMinor    → 1.3.6.1.4.1.1139.205.1.2.3 (Severity 3)
├── powerstoreGenericTrapWarning  → 1.3.6.1.4.1.1139.205.1.2.4 (Severity 4)
└── powerstoreGenericTrapInfo     → 1.3.6.1.4.1.1139.205.1.2.5 (Severity 5)
```

### 📋 **MIB Objects**
PowerStore trap objects from actual MIB definition:

```
Object Hierarchy: 1.3.6.1.4.1.1139.205.1.1.x
├── powerstoreTrapResourceName → 1.3.6.1.4.1.1139.205.1.1.1
├── powerstoreTrapDescription  → 1.3.6.1.4.1.1139.205.1.1.2
├── powerstoreTrapTimestamp    → 1.3.6.1.4.1.1139.205.1.1.3
├── powerstoreTrapSeverity     → 1.3.6.1.4.1.1139.205.1.1.4
└── powerstoreTrapState        → 1.3.6.1.4.1.1139.205.1.1.5
```

## Implementation Changes

### ✅ **Enhanced Severity Determination**

#### Before (Static mapping):
```javascript
function setSeverityAndDescription(trapInfo, trapOID) {
    event.severity = trapInfo.severity; // Static from trapInfoMap
    // ...
}
```

#### After (MIB-based dynamic):
```javascript
function getPowerStoreTrapSeverity(varbinds, trapOID) {
    // First priority: powerstoreTrapSeverity object
    var severityMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapSeverity + '\\s*=\\s*([^\\r\\n]+)'));
    if (severityMatch) {
        var severityText = severityMatch[1].trim().toLowerCase();
        
        switch (severityText) {
            case 'critical': return 1;
            case 'major': return 2;
            case 'minor': return 3;
            case 'warning': return 4;
            case 'info': case 'informational': return 5;
            default:
                // Try numeric parsing
                var numericSeverity = parseInt(severityText);
                if (!isNaN(numericSeverity) && numericSeverity >= 1 && numericSeverity <= 5) {
                    return numericSeverity;
                }
        }
    }
    
    // Fallback: Determine from trap OID
    if (trapOID === '1.3.6.1.4.1.1139.205.1.2.1') return 1; // Critical
    if (trapOID === '1.3.6.1.4.1.1139.205.1.2.2') return 2; // Major
    if (trapOID === '1.3.6.1.4.1.1139.205.1.2.3') return 3; // Minor
    if (trapOID === '1.3.6.1.4.1.1139.205.1.2.4') return 4; // Warning
    if (trapOID === '1.3.6.1.4.1.1139.205.1.2.5') return 5; // Info
    
    return 3; // Default to Minor
}
```

### 🔧 **Enhanced Varbind Parsing**

#### PowerStore-Specific Object Extraction:
```javascript
function parseVarbinds(trapInfo) {
    var varbinds = event.additional_info || '';
    
    if (trapInfo.system === 'PowerStore') {
        // Extract powerstoreTrapDescription (used for event description)
        var descMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapDescription + '\\s*=\\s*([^\\r\\n]+)'));
        if (descMatch) {
            event.u_trap_description = descMatch[1].trim();
            // Also used directly in setSeverityAndDescription for event.description
        }
        
        // Extract powerstoreTrapResourceName (for resource field)
        var resourceMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapResourceName + '\\s*=\\s*([^\\r\\n]+)'));
        if (resourceMatch) {
            event.u_powerstore_resource = resourceMatch[1].trim();
        }
        
        // Extract powerstoreTrapTimestamp
        var timestampMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapTimestamp + '\\s*=\\s*([^\\r\\n]+)'));
        if (timestampMatch) {
            event.u_powerstore_timestamp = timestampMatch[1].trim();
        }
        
        // Extract powerstoreTrapSeverity
        var severityMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapSeverity + '\\s*=\\s*([^\\r\\n]+)'));
        if (severityMatch) {
            event.u_powerstore_severity = severityMatch[1].trim();
        }
        
        // Extract powerstoreTrapState
        var stateMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapState + '\\s*=\\s*([^\\r\\n]+)'));
        if (stateMatch) {
            event.u_powerstore_state = stateMatch[1].trim();
        }
    }
}
```

## Custom Fields Enhanced

### 📝 **New PowerStore-Specific Fields**
- **u_powerstore_resource**: Resource name from powerstoreTrapResourceName
- **u_powerstore_timestamp**: Event timestamp from powerstoreTrapTimestamp  
- **u_powerstore_severity**: Severity text from powerstoreTrapSeverity
- **u_powerstore_state**: Alert state from powerstoreTrapState
- **u_trap_description**: Description from powerstoreTrapDescription

### 🎯 **Field Mapping Priority**

#### Severity Determination:
1. **powerstoreTrapSeverity object** - Primary source from MIB
2. **Trap OID mapping** - Based on powerstoreGenericTrap hierarchy
3. **Static fallback** - Default to Minor (3)

#### Resource Field:
1. **powerstoreTrapResourceName** - Primary source for resource field
2. **System-specific patterns** - Unity/ECS fallbacks
3. **System name fallback** - 'Dell ' + system type

## Example Usage

### PowerStore Major Alert Example
```
Input SNMP Trap:
Trap OID: 1.3.6.1.4.1.1139.205.1.2.2 (powerstoreGenericTrapMajor)
Varbinds:
  13 = powerstore-prod-01
  1.3.6.1.4.1.1139.205.1.1.1 = Volume_Production_DB
  1.3.6.1.4.1.1139.205.1.1.2 = Volume capacity threshold exceeded
  1.3.6.1.4.1.1139.205.1.1.3 = 1640995200
  1.3.6.1.4.1.1139.205.1.1.4 = Major
  1.3.6.1.4.1.1139.205.1.1.5 = Active

Result Fields:
- Node: powerstore-prod-01 (from varbind 13)
- Resource: Volume_Production_DB (from powerstoreTrapResourceName)
- Severity: 2 (from powerstoreTrapSeverity "Major")
- Description: [MAJOR] PowerStore Major Alert (Trap OID: 1.3.6.1.4.1.1139.205.1.2.2)
- u_powerstore_resource: Volume_Production_DB
- u_powerstore_severity: Major
- u_powerstore_state: Active
- u_trap_description: Volume capacity threshold exceeded
```

### PowerStore Critical Alert Example
```
Input SNMP Trap:
Trap OID: 1.3.6.1.4.1.1139.205.1.2.1 (powerstoreGenericTrapCritical)
Varbinds:
  13 = powerstore-cluster-02
  1.3.6.1.4.1.1139.205.1.1.1 = Array_Controller_A
  1.3.6.1.4.1.1139.205.1.1.2 = Storage controller failure detected
  1.3.6.1.4.1.1139.205.1.1.4 = Critical
  1.3.6.1.4.1.1139.205.1.1.5 = Failed

Result Fields:
- Node: powerstore-cluster-02 (from varbind 13)
- Resource: Array_Controller_A (from powerstoreTrapResourceName)
- Severity: 1 (from powerstoreTrapSeverity "Critical")
- Description: [CRITICAL] PowerStore Critical Alert (Trap OID: 1.3.6.1.4.1.1139.205.1.2.1)
- u_powerstore_resource: Array_Controller_A
- u_powerstore_severity: Critical
- u_powerstore_state: Failed
```

## Severity Mapping Logic

### 🎯 **Text to Numeric Conversion**
```javascript
PowerStore Severity Text → ServiceNow Severity → Priority
├── "Critical"     → 1 → P1 (Critical)
├── "Major"        → 2 → P2 (High)
├── "Minor"        → 3 → P3 (Moderate)
├── "Warning"      → 4 → P4 (Low)
└── "Info"         → 5 → P5 (Planning)
```

### 🔄 **Fallback Hierarchy**
1. **powerstoreTrapSeverity object** (most accurate)
2. **Trap OID-based mapping** (reliable)
3. **Default to Minor** (safe fallback)

## Benefits

### ✅ **Accuracy Improvements**
- **MIB Compliance**: Uses actual PowerStore MIB structure
- **Dynamic Severity**: Real-time severity from trap objects
- **Rich Context**: Extracts all available PowerStore trap objects
- **State Awareness**: Captures alert state information

### 🎯 **Operational Benefits**
- **Better Alerting**: More accurate severity determination
- **Enhanced Troubleshooting**: Additional PowerStore-specific fields
- **State Tracking**: Alert state progression monitoring
- **Resource Identification**: Precise resource naming from MIB

### 🔧 **Technical Benefits**
- **Standards Compliance**: Follows PowerStore-MIB specifications
- **Extensibility**: Easy to add new PowerStore objects
- **Robustness**: Multiple fallback mechanisms
- **Performance**: Efficient regex pattern matching

## Testing Scenarios

### Test Cases
1. **Critical Trap**: Verify OID 1.3.6.1.4.1.1139.205.1.2.1 → Severity 1
2. **Major Trap**: Verify OID 1.3.6.1.4.1.1139.205.1.2.2 → Severity 2
3. **Severity Object**: Test powerstoreTrapSeverity text parsing
4. **Resource Extraction**: Validate powerstoreTrapResourceName usage
5. **State Tracking**: Confirm powerstoreTrapState capture
6. **Fallback Logic**: Test behavior without MIB objects

### Sample Test Data
```
Test Case 1 - Complete PowerStore Trap:
Trap OID: 1.3.6.1.4.1.1139.205.1.2.2
Varbinds:
  13 = ps-array-test
  1.3.6.1.4.1.1139.205.1.1.1 = TestVolume001
  1.3.6.1.4.1.1139.205.1.1.2 = Test alert description
  1.3.6.1.4.1.1139.205.1.1.4 = Major
  1.3.6.1.4.1.1139.205.1.1.5 = Active

Expected Results:
- Severity: 2 (Major)
- Node: ps-array-test
- Resource: TestVolume001
- u_powerstore_severity: Major
- u_powerstore_state: Active
```

## Related Files Updated
- ✅ **Handler Script**: `servicenow_dell_emc_storage_trap_handler.js`
- ✅ **MIB Documentation**: This document
- ✅ **Previous Documentation**: `dell_emc_storage_eventfieldmappingscript_documentation.md`

## Compliance Notes
- **MIB Standards**: Based on actual Dell PowerStore-MIB
- **ServiceNow Standards**: Maintains eventFieldMappingScript compliance
- **Field Operations**: Uses setValue() without update() calls
- **Error Handling**: Robust fallback mechanisms for reliability

This implementation ensures accurate PowerStore trap processing using the official MIB structure while maintaining ServiceNow ITOM compliance and operational reliability.