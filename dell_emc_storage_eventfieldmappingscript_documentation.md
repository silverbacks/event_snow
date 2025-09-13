# Dell/EMC Storage EventFieldMappingScript Implementation
## Enterprise OID: 1.3.6.1.4.1.1139

## Overview
This document describes the ServiceNow ITOM eventFieldMappingScript implementation for Dell/EMC storage systems using enterprise OID `1.3.6.1.4.1.1139`. The script handles SNMP traps from multiple Dell/EMC storage platforms including PowerStore, Unity, and ECS (Elastic Cloud Storage).

## Enterprise OID Information
- **Enterprise OID**: `1.3.6.1.4.1.1139`
- **Vendor**: EMC Corporation (now Dell Technologies)
- **Systems Supported**: 
  - Dell PowerStore (OID: 1.3.6.1.4.1.1139.205)
  - Dell Unity (OID: 1.3.6.1.4.1.1139.103) 
  - Dell ECS (OID: 1.3.6.1.4.1.1139.300)
  - Legacy EMC Storage Systems

## Key Features

### ✅ ServiceNow Compliance
- **Standard Function Signature**: Uses official 3-parameter eventFieldMappingScript pattern
- **Error Handling**: ServiceNow-compliant error management with gs.error() logging
- **Field Operations**: Proper use of eventGr.setValue() without eventGr.update()
- **Return Values**: Boolean return values only (true/false)
- **Event Immutability**: Respects ServiceNow event immutability principles

### 🎯 Assignment Group Logic
All Dell/EMC storage events are routed to: **storage-fts**

### 🔧 System Detection
The script automatically detects storage system types based on trap OIDs:
```javascript
function determineStorageSystemType(additionalInfo) {
    if (additionalInfo.indexOf('1.3.6.1.4.1.1139.205') >= 0) return 'PowerStore';
    else if (additionalInfo.indexOf('1.3.6.1.4.1.1139.103') >= 0) return 'Unity';
    else if (additionalInfo.indexOf('1.3.6.1.4.1.1139.300') >= 0) return 'ECS';
    return 'Dell/EMC Storage';
}
```

### 📊 Trap OID Mappings

#### PowerStore Traps (1.3.6.1.4.1.1139.205.x.x.x)
- **Critical**: `1.3.6.1.4.1.1139.205.1.2.1` → Severity 1
- **Major**: `1.3.6.1.4.1.1139.205.1.2.2` → Severity 2
- **Minor**: `1.3.6.1.4.1.1139.205.1.2.3` → Severity 3
- **Warning**: `1.3.6.1.4.1.1139.205.1.2.4` → Severity 4
- **Info**: `1.3.6.1.4.1.1139.205.1.2.5` → Severity 5

#### Unity Traps (1.3.6.1.4.1.1139.103.x.x.x)
- **Critical**: `1.3.6.1.4.1.1139.103.1.1.1` → Severity 1
- **Major**: `1.3.6.1.4.1.1139.103.1.1.2` → Severity 2
- **Minor**: `1.3.6.1.4.1.1139.103.1.1.3` → Severity 3

#### ECS Traps (1.3.6.1.4.1.1139.300.x.x.x)
- **Critical**: `1.3.6.1.4.1.1139.300.1.1.1` → Severity 1
- **Major**: `1.3.6.1.4.1.1139.300.1.1.2` → Severity 2

### 🏷️ Field Mappings

#### Standard Event Fields
```javascript
eventGr.setValue('assignment_group', 'storage-fts');
eventGr.setValue('u_vendor', 'Dell/EMC');
eventGr.setValue('type', 'Dell ' + systemType + ' Storage Alert');
eventGr.setValue('category', 'Storage');
eventGr.setValue('subcategory', 'Dell ' + systemType);
eventGr.setValue('u_component_type', componentType);
```

#### Component Type Mapping
- **PowerStore**: Array
- **Unity**: Array  
- **ECS**: ObjectStore
- **Generic**: Storage

### 🧹 Hostname Cleaning
The script removes storage-specific suffixes from hostnames:
- `-powerstore`, `-unity`, `-ecs`
- `-storage`, `-mgmt`, `-san`
- Maintains CMDB compatibility

### 📝 Custom Fields Populated
- **u_vendor**: Set to 'Dell/EMC'
- **u_component_type**: Based on storage system type
- **u_trap_description**: Extracted from varbinds
- **u_snmp_varbinds**: Complete varbind information

### 🎯 Field Extraction Logic
- **Node Field**: Uses varbind 13 as primary source for node identification
- **Resource Field**: Uses powerstoreTrapResourceName values from varbinds
- **Fallback Logic**: Hierarchical fallback for both node and resource fields

## Implementation Details

### EventFieldMappingScript Function
```javascript
function eventFieldMappingScript(eventGr, origEventSysId, fieldMappingRuleName) {
    try {
        var source = eventGr.getValue('source') || eventGr.getValue('node') || 'unknown';
        var systemType = determineStorageSystemType(eventGr.getValue('additional_info') || '');
        
        // Route all Dell/EMC storage events to storage-fts
        eventGr.setValue('assignment_group', 'storage-fts');
        eventGr.setValue('u_vendor', 'Dell/EMC');
        eventGr.setValue('type', 'Dell ' + systemType + ' Storage Alert');
        
        return true;
    } catch (e) {
        gs.error("The script type mapping rule '" + fieldMappingRuleName + "' ran with the error: \\n" + e);
        return false;
    }
}
```

### Priority Hierarchy
1. **Primary**: eventFieldMappingScript (ServiceNow standard)
2. **Fallback**: Static assignment to Storage-Support

### Node and Resource Field Extraction

#### Node Field Priority (getSourceNode function):
1. **Varbind 13**: Primary source - extracts value from varbind position 13
2. **sysName OID**: Standard SNMP sysName (1.3.6.1.2.1.1.5.0)
3. **Event Source**: Fallback to event.source field

#### Resource Field Priority (getResource function):
1. **powerstoreTrapResourceName**: PowerStore-specific resource name from MIB
2. **System-specific patterns**: Unity and ECS resource extraction
3. **System fallback**: 'Dell ' + system type

```javascript
// Node field extraction from varbind 13
var varbind13Match = varbinds.match(/(?:^|\n)\s*13\s*=\s*([^\r\n]+)/i);

// Resource field from PowerStore MIB
var resourceNameMatch = varbinds.match(new RegExp(emcStorageOIDs.powerstoreTrapResourceName + '\s*=\s*([^\r\n]+)'));
```

## Usage Examples

### PowerStore Alert Example
```
Trap OID: 1.3.6.1.4.1.1139.205.1.2.2
Result:
- Assignment Group: storage-fts
- Vendor: Dell/EMC
- Type: Dell PowerStore Storage Alert
- Category: Storage
- Subcategory: Dell PowerStore
- Component Type: Array
- Severity: 2 (Major)
```

### Unity Alert Example
```
Trap OID: 1.3.6.1.4.1.1139.103.1.1.1
Result:
- Assignment Group: storage-fts
- Vendor: Dell/EMC
- Type: Dell Unity Storage Alert
- Category: Storage
- Subcategory: Dell Unity
- Component Type: Array
- Severity: 1 (Critical)
```

### ECS Alert Example
```
Trap OID: 1.3.6.1.4.1.1139.300.1.1.2
Result:
- Assignment Group: storage-fts
- Vendor: Dell/EMC
- Type: Dell ECS Storage Alert
- Category: Storage
- Subcategory: Dell ECS
- Component Type: ObjectStore
- Severity: 2 (Major)
```

## Testing and Validation

### Pre-Deployment Checklist
- ✅ **Syntax Validation**: JavaScript syntax checked and validated
- ✅ **Function Signature**: Correct 3-parameter eventFieldMappingScript
- ✅ **Error Handling**: ServiceNow-compliant error management
- ✅ **Field Operations**: Proper setValue usage without update calls
- ✅ **Assignment Group**: Storage-Support routing confirmed

### Test Scenarios
1. **PowerStore Trap Processing**: Verify OID detection and field mapping
2. **Unity Trap Processing**: Confirm system type identification
3. **ECS Trap Processing**: Validate object store component assignment
4. **Error Handling**: Test with malformed SNMP data
5. **Hostname Cleaning**: Verify suffix removal functionality

## Deployment Instructions

### ServiceNow Configuration
1. **Import Script**: Add script to ServiceNow ITOM Event Management
2. **Configure Rule**: Create event field mapping rule for OID 1.3.6.1.4.1.1139
3. **Assignment Group**: Ensure Storage-Support group exists and is active
4. **Custom Fields**: Create necessary custom fields (u_vendor, u_component_type, etc.)

### SNMP Configuration
1. **MIB Files**: Import Dell/EMC MIB files for proper trap decoding
2. **Trap Forwarding**: Configure storage systems to send traps to ServiceNow
3. **Community Strings**: Set up appropriate SNMP community configurations

## Benefits

### 🎯 **Operational Benefits**
- **Unified Routing**: All Dell/EMC storage events go to Storage-Support
- **System Identification**: Automatic detection of PowerStore, Unity, ECS systems
- **Standard Compliance**: Follows ServiceNow ITOM best practices
- **Enhanced Troubleshooting**: Detailed varbind parsing and custom fields

### 🔧 **Technical Benefits**
- **ServiceNow Integration**: Native eventFieldMappingScript implementation
- **Error Resilience**: Robust error handling and fallback mechanisms
- **Extensibility**: Easy to add new Dell/EMC storage systems
- **Maintenance**: Clean code structure following ServiceNow patterns

## Related Files
- **Handler Script**: `servicenow_dell_emc_storage_trap_handler.js`
- **Implementation Guide**: This document
- **Compliance Summary**: `servicenow_all_handlers_compliance_summary.md`

## Support Information
- **Enterprise OID**: 1.3.6.1.4.1.1139 (Dell/EMC)
- **Assignment Group**: storage-fts
- **Vendor Support**: Dell Technologies storage support
- **ServiceNow**: Compatible with ServiceNow ITOM Event Management

This implementation ensures comprehensive coverage of Dell/EMC storage systems while maintaining ServiceNow compliance standards and operational efficiency.