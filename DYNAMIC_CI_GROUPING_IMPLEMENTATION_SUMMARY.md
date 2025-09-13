# Dynamic CI Grouping Implementation Summary

## Overview
This document summarizes the implementation of Dynamic CI Grouping across all ServiceNow ITOM SNMP trap handlers for enterprise hardware vendors. The Dynamic CI Grouping feature provides intelligent assignment group routing based on Configuration Item (CI) relationships, business services, and vendor-specific mapping tables.

## Implementation Status

### ✅ Completed Implementations

#### 1. HP iLO Trap Handler (`servicenow_hp_ilo_trap_handler.js`)
- **Status**: ✅ Completed with Dynamic CI Grouping + Hostname-Based Routing
- **Hostname-Based Routing**: 
  - `-con` pattern → `UNIX-SUPPORT` (highest priority)
  - `r` pattern → `WINDOWS-SERVER-TEAM` (high priority)
- **Dynamic CI Query**: Queries `cmdb_ci_server` for HP server CIs
- **Correlation Keys**: hostname, FQDN, IP address, service tag
- **Vendor-Specific**: HP service tag mapping support
- **Fallback Groups**: Hardware-Support, Storage-Support, Network-Support, Performance-Support

#### 2. Dell iDRAC Trap Handler (`servicenow_dell_idrac_trap_handler.js`)
- **Status**: ✅ Completed with Dynamic CI Grouping  
- **Dynamic CI Query**: Queries `cmdb_ci_server` for Dell server CIs
- **Correlation Keys**: hostname, FQDN, IP address, service tag
- **Vendor-Specific**: Dell service tag mapping with `u_dell_server_mapping` table
- **Fallback Groups**: Storage-Support, Network-Support, Performance-Support, Hardware-Support

#### 3. Dell PowerStore Trap Handler (`servicenow_dell_powerstore_trap_handler.js`)
- **Status**: ✅ Completed with Dynamic CI Grouping
- **Dynamic CI Query**: Queries `cmdb_ci_storage_server` for PowerStore storage CIs
- **Correlation Keys**: hostname, FQDN, IP address, array serial number
- **Vendor-Specific**: PowerStore array serial mapping with `u_powerstore_array_mapping` table
- **Fallback Groups**: Storage-Support, Network-Support, Storage-Performance, Storage-Management

#### 4. NetApp ONTAP Trap Handler (`servicenow_netapp_trap_handler.js`)
- **Status**: ✅ Completed with Dynamic CI Grouping
- **Dynamic CI Query**: Queries `cmdb_ci_storage_server` for NetApp storage CIs
- **Correlation Keys**: hostname, FQDN, IP address, serial number
- **Vendor-Specific**: NetApp array serial mapping with `u_netapp_array_mapping` table  
- **Fallback Groups**: Storage-FTS, Network-Support, Storage-Performance, Storage-Management

## Dynamic CI Grouping Architecture

### Core Components

#### 1. Primary CI Lookup
```javascript
function getDynamicAssignmentGroup(nodeName, trapInfo) {
    // Query CMDB for CI using multiple correlation keys
    var ciGR = new GlideRecord('cmdb_ci_server'); // or cmdb_ci_storage_server
    ciGR.addQuery('name', nodeName);
    ciGR.addOrCondition('fqdn', nodeName);
    ciGR.addOrCondition('ip_address', nodeName);
    if (serviceTag) {
        ciGR.addOrCondition('serial_number', serviceTag);
    }
}
```

#### 2. CI Grouping Rules Lookup
```javascript
function findCIGroupingRule(ciSysId, ciClass, trapInfo) {
    // Check custom grouping rules table
    var ruleGR = new GlideRecord('u_storage_ci_grouping_rules');
    ruleGR.addQuery('ci_class', ciClass);
    ruleGR.addQuery('component_category', trapInfo.category);
    ruleGR.addQuery('vendor', vendor);
}
```

#### 3. Vendor-Specific Serial Mapping
```javascript
function getVendorSerialAssignmentGroup(serialNumber, category) {
    // Check vendor-specific mapping tables
    var arrayGR = new GlideRecord('u_[vendor]_array_mapping');
    // Return category-specific support groups
}
```

#### 4. Business Service Relationships
```javascript
function getBusinessServiceAssignmentGroup(ciSysId, category) {
    // Query CI relationships to business services
    var relGR = new GlideRecord('cmdb_rel_ci');
    relGR.addQuery('child', ciSysId);
    relGR.addQuery('parent.sys_class_name', 'STARTSWITH', 'cmdb_ci_service');
}
```

## Assignment Group Logic Hierarchy

### HP iLO Specific Priority Order (Highest to Lowest)
1. **Hostname-Based Routing** - Pattern-based assignment for specific OS types
   - `-con` pattern → `UNIX-SUPPORT` (UNIX/Linux systems)
   - `r` pattern → `WINDOWS-SERVER-TEAM` (Windows systems)
2. **Custom CI Grouping Rules** - `u_storage_ci_grouping_rules` table
3. **Vendor Serial Mapping** - `u_[vendor]_array_mapping` tables
4. **Business Service Relationships** - Based on CI-to-service mappings
5. **Service Category Support Groups** - Service-specific support group fields
6. **Fallback Static Assignment** - Component-based default groups

### Other Vendors Priority Order (Highest to Lowest)
1. **Custom CI Grouping Rules** - `u_storage_ci_grouping_rules` table
2. **Vendor Serial Mapping** - `u_[vendor]_array_mapping` tables
3. **Business Service Relationships** - Based on CI-to-service mappings
4. **Service Category Support Groups** - Service-specific support group fields
5. **Fallback Static Assignment** - Component-based default groups

### Category-Specific Routing

#### Storage Components
- **Categories**: storage, capacity, replication, protection, volume, aggregate
- **Primary Groups**: Storage-Support, Storage-FTS (NetApp)
- **Service Fields**: u_storage_support_group

#### Network Components  
- **Categories**: network, connectivity, host
- **Primary Groups**: Network-Support
- **Service Fields**: u_network_support_group

#### Performance Components
- **Categories**: performance, IOPS, latency, bandwidth
- **Primary Groups**: Storage-Performance, Performance-Support  
- **Service Fields**: u_performance_support_group

#### Management Components
- **Categories**: security, management, authentication
- **Primary Groups**: Storage-Management, Hardware-Support
- **Service Fields**: u_storage_management_support_group

## Vendor-Specific Implementations

### HP iLO Dynamic Features
- **CI Type**: Server CIs (`cmdb_ci_server`)
- **Hostname-Based Routing**: 
  - **UNIX Systems**: `-con` pattern → `UNIX-SUPPORT`
  - **Windows Systems**: `r` pattern → `WINDOWS-SERVER-TEAM`
  - **Priority**: Hostname routing takes precedence over Dynamic CI Grouping
- **Service Tag**: HP server service tag correlation
- **Special Handling**: iLO-specific component categories
- **Debug Logging**: `HP iLO Dynamic Assignment`, `HP iLO Hostname Routing`

### Dell iDRAC Dynamic Features  
- **CI Type**: Server CIs (`cmdb_ci_server`)
- **Service Tag**: Dell service tag with `u_dell_server_mapping`
- **Special Handling**: iDRAC-specific component categories
- **Debug Logging**: `Dell iDRAC Dynamic Assignment`

### Dell PowerStore Dynamic Features
- **CI Type**: Storage Server CIs (`cmdb_ci_storage_server`) 
- **Array Serial**: PowerStore serial with `u_powerstore_array_mapping`
- **Special Handling**: Storage array and volume categories
- **Debug Logging**: `PowerStore Dynamic Assignment`

### NetApp ONTAP Dynamic Features
- **CI Type**: Storage Server CIs (`cmdb_ci_storage_server`)
- **Array Serial**: NetApp serial with `u_netapp_array_mapping`
- **Special Handling**: ONTAP volume and aggregate categories  
- **Debug Logging**: `NetApp Dynamic Assignment`

## Required ServiceNow Tables

### Core Tables (Must Exist)
- `cmdb_ci_server` - Server configuration items
- `cmdb_ci_storage_server` - Storage system configuration items
- `cmdb_rel_ci` - CI relationship table
- `cmdb_ci_service` - Business service CIs
- `cmdb_ci_service_discovered` - Discovered services

### Optional Vendor-Specific Tables
```sql
-- Custom CI grouping rules
CREATE TABLE u_storage_ci_grouping_rules (
    ci_class VARCHAR(100),
    component_category VARCHAR(50),
    vendor VARCHAR(50),
    product VARCHAR(50),
    assignment_group VARCHAR(32),
    active BOOLEAN,
    order INTEGER
);

-- Dell server mapping
CREATE TABLE u_dell_server_mapping (
    service_tag VARCHAR(50),
    server_support_group VARCHAR(32),
    storage_support_group VARCHAR(32),
    network_support_group VARCHAR(32),
    performance_support_group VARCHAR(32),
    default_support_group VARCHAR(32),
    active BOOLEAN
);

-- Dell PowerStore mapping  
CREATE TABLE u_powerstore_array_mapping (
    array_serial VARCHAR(50),
    storage_support_group VARCHAR(32),
    network_support_group VARCHAR(32),
    performance_support_group VARCHAR(32),
    management_support_group VARCHAR(32),
    default_support_group VARCHAR(32),
    active BOOLEAN
);

-- NetApp array mapping
CREATE TABLE u_netapp_array_mapping (
    array_serial VARCHAR(50),
    storage_support_group VARCHAR(32),
    network_support_group VARCHAR(32), 
    performance_support_group VARCHAR(32),
    management_support_group VARCHAR(32),
    default_support_group VARCHAR(32),
    active BOOLEAN
);
```

### Business Service Support Group Fields
Add these fields to service CI tables (`cmdb_ci_service`, `cmdb_ci_service_discovered`):
- `u_storage_support_group` - Storage component support group
- `u_network_support_group` - Network component support group  
- `u_performance_support_group` - Performance component support group
- `u_storage_management_support_group` - Storage management support group
- `u_netapp_support_group` - NetApp-specific support group (NetApp only)

## Error Handling and Logging

### Debug Logging
Each implementation includes comprehensive debug logging:
```javascript
gs.log('Error in getDynamicAssignmentGroup: ' + error.toString(), '[Vendor] Dynamic Assignment');
```

### Graceful Fallback
All implementations provide graceful fallback to static assignment groups if dynamic lookup fails.

### Null Safety
Extensive null and undefined checking prevents runtime errors during CI queries and relationship lookups.

## Testing and Validation

### Test Scenarios
1. **CI Found with Custom Rules** - Verify custom grouping rule precedence
2. **CI Found with Serial Mapping** - Test vendor-specific serial correlation  
3. **CI Found with Service Relationships** - Validate business service grouping
4. **CI Not Found** - Confirm fallback to static assignment
5. **Database Errors** - Test error handling and logging

### Validation Commands
```javascript
// Test CI lookup for server
var server = new GlideRecord('cmdb_ci_server');
server.addQuery('name', 'test-server-01');
server.query();

// Test storage CI lookup
var storage = new GlideRecord('cmdb_ci_storage_server'); 
storage.addQuery('serial_number', 'TEST123456');
storage.query();

// Test service relationships
var rel = new GlideRecord('cmdb_rel_ci');
rel.addQuery('child', ci_sys_id);
rel.query();
```

## Benefits of Dynamic CI Grouping

### 1. Intelligent Routing
- **Context-Aware**: Assignment based on actual CI relationships
- **Business-Aligned**: Routes to teams responsible for specific services  
- **Vendor-Specific**: Leverages vendor knowledge for optimal routing

### 2. Operational Efficiency
- **Reduced Manual Routing**: Automatic assignment to correct teams
- **Faster Resolution**: Events routed to subject matter experts
- **Consistent Routing**: Standardized logic across all vendors

### 3. Scalability  
- **Rule-Based**: Easy to add new vendors and components
- **Table-Driven**: Configuration without code changes
- **Relationship-Aware**: Leverages existing CMDB investments

### 4. Maintainability
- **Centralized Logic**: Common pattern across all implementations  
- **Debuggable**: Comprehensive logging for troubleshooting
- **Extensible**: Easy to add new routing criteria

## Migration from Static Assignment Groups

### Before Dynamic CI Grouping
```javascript
// Static assignment based only on component type  
switch (trapInfo.category.toLowerCase()) {
    case 'storage':
        event.assignment_group = 'Storage-Support';
        break;
    case 'network':
        event.assignment_group = 'Network-Support';  
        break;
}
```

### After Dynamic CI Grouping
```javascript  
// Dynamic assignment with CI relationships and fallback
var dynamicGroup = getDynamicAssignmentGroup(event.node, trapInfo);
if (dynamicGroup) {
    event.assignment_group = dynamicGroup;
} else {
    // Fallback to component-based assignment
    event.assignment_group = getStaticAssignmentGroup(trapInfo.category);
}
```

## Future Enhancements

### Planned Features
1. **AI-Based Routing** - Machine learning for assignment optimization
2. **Multi-Vendor Correlation** - Cross-vendor event correlation  
3. **Time-Based Routing** - Assignment groups based on time zones and shifts
4. **Escalation Integration** - Dynamic escalation based on CI criticality
5. **Service Impact Correlation** - Route based on service impact analysis

### Integration Opportunities  
1. **ITSM Integration** - Integrate with Incident and Problem management
2. **Monitoring Integration** - Correlation with monitoring tool data
3. **Asset Management** - Enhanced correlation with asset data
4. **Change Management** - Route based on active changes

## Conclusion

The Dynamic CI Grouping implementation provides a comprehensive, vendor-agnostic framework for intelligent assignment group routing in ServiceNow ITOM Event Management. All four major vendor trap handlers (HP iLO, Dell iDRAC, Dell PowerStore, NetApp ONTAP) now support:

- ✅ Dynamic CI correlation and lookup
- ✅ Vendor-specific serial number mapping  
- ✅ Business service relationship routing
- ✅ Category-specific support group assignment
- ✅ Graceful fallback to static assignment
- ✅ Comprehensive error handling and logging

This implementation significantly improves event routing accuracy, operational efficiency, and maintainability while providing a foundation for future enhancements and scalability.