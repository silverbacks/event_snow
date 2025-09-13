# Dell iDRAC SNMP Trap Test Examples

## Overview
This document provides comprehensive test examples for validating the Dell iDRAC SNMP trap handler implementation in ServiceNow ITOM. It includes test events, expected outcomes, and validation scenarios based on actual Dell MIB files.

## OME (OM Essentials) Trap Tests - PRIMARY

### Test Case 1: OME System Down (Critical)
```json
{
  "source": "dell-server-01-idrac",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.1000.100.1.1001\n1.3.6.1.2.1.1.5.0 = dell-server-01-idrac\n1.3.6.1.4.1.674.11000.1000.100.1.1 = System offline - communication lost\n1.3.6.1.4.1.674.11000.1000.100.1.2 = DELL-SERVER-01\n1.3.6.1.4.1.674.11000.1000.100.1.3 = Critical"
}
```

**Expected Results:**
- `event.source = "dell-server-01"`
- `event.node = "dell-server-01"`
- `event.severity = 1` (Critical)
- `event.category = "System"`
- `event.u_component_type = "Status"`
- `event.assignment_group = "Hardware-Server-Support"`
- `event.u_ome_alert_message = "System offline - communication lost"`
- `event.u_ome_alert_device = "DELL-SERVER-01"`
- `event.u_ome_alert_severity = "Critical"`

### Test Case 2: OME System Up (Info)
```json
{
  "source": "db-server-02-drac",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 987654321\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.1000.100.1.1000\n1.3.6.1.2.1.1.5.0 = db-server-02-drac\n1.3.6.1.4.1.674.11000.1000.100.1.1 = System online - communication restored\n1.3.6.1.4.1.674.11000.1000.100.1.2 = DB-SERVER-02\n1.3.6.1.4.1.674.11000.1000.100.1.3 = Informational"
}
```

**Expected Results:**
- `event.source = "db-server-02"`
- `event.node = "db-server-02"`
- `event.severity = 5` (Info)
- `event.category = "System"`
- `event.u_component_type = "Status"`
- `event.assignment_group = "Hardware-Server-Support"`
- `event.u_ome_alert_message = "System online - communication restored"`
- `event.u_ome_alert_device = "DB-SERVER-02"`

### Test Case 3: OME Critical Status
```json
{
  "source": "web-server-03-mgmt",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 555666777\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.1000.100.1.3004\n1.3.6.1.2.1.1.5.0 = web-server-03-mgmt\n1.3.6.1.4.1.674.11000.1000.100.1.1 = Device status changed to critical\n1.3.6.1.4.1.674.11000.1000.100.1.2 = WEB-SERVER-03"
}
```

**Expected Results:**
- `event.source = "web-server-03"`
- `event.node = "web-server-03"`
- `event.severity = 1` (Critical)
- `event.category = "System"`
- `event.u_component_type = "Status"`
- `event.assignment_group = "Hardware-Server-Support"`

### Test Case 4: OME Forwarded Alert
```json
{
  "source": "app-server-04-oob",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 111222333\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.1000.100.1.2000\n1.3.6.1.2.1.1.5.0 = app-server-04-oob\n1.3.6.1.4.1.674.11000.1000.100.1.1 = Power supply redundancy lost - forwarded from OMSA\n1.3.6.1.4.1.674.11000.1000.100.1.2 = APP-SERVER-04\n1.3.6.1.4.1.674.11000.1000.100.1.3 = Major"
}
```

**Expected Results:**
- `event.source = "app-server-04"`
- `event.node = "app-server-04"`
- `event.severity = 3` (Info - forwarded alert default)
- `event.category = "Management"`
- `event.u_component_type = "Alert"`
- `event.assignment_group = "Server-Management"`

## Legacy OpenManage Trap Tests

### Test Case 1: Critical Power Supply Failure
```json
{
  "source": "dell-server-01-idrac",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.10892.1.0.1106\n1.3.6.1.2.1.1.5.0 = dell-server-01-idrac\n1.3.6.1.4.1.674.10892.1.300.10.1.11.1 = ABC1234\n1.3.6.1.4.1.674.10892.1.300.10.1.12.1 = 567-890-123\n1.3.6.1.4.1.674.10892.1.300.10.1.9.1 = PowerEdge R750\n1.3.6.1.4.1.674.10892.1.300.10.1.5.1 = 2.15.0\n1.3.6.1.4.1.674.10892.5.1.1.6.0 = 6.10.30.00\n1.3.6.1.4.1.674.10892.1.600.12.1.5.1 = 5"
}
```

**Expected Results:**
- `event.source = "dell-server-01"`
- `event.node = "dell-server-01"`
- `event.severity = 1` (Critical)
- `event.category = "Hardware"`
- `event.u_component_type = "Power"`
- `event.assignment_group = "Hardware-Server-Support"`
- `event.u_service_tag = "ABC1234"`
- `event.u_express_service_code = "567-890-123"`
- `event.u_system_model = "PowerEdge R750"`
- `event.u_idrac_version = "6.10.30.00"`

### Test Case 2: Storage Controller Failure
```json
{
  "source": "db-server-02-drac",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 987654321\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.10892.1.0.1304\n1.3.6.1.2.1.1.5.0 = db-server-02-drac\n1.3.6.1.4.1.674.10892.1.300.10.1.11.1 = XYZ5678\n1.3.6.1.4.1.674.10892.1.300.10.1.9.1 = PowerEdge R640\n1.3.6.1.4.1.674.10892.1.1400.10.1.4.1 = 5\n1.3.6.1.4.1.674.10892.5.1.1.6.0 = 5.10.50.00"
}
```

**Expected Results:**
- `event.source = "db-server-02"`
- `event.node = "db-server-02"`
- `event.severity = 1` (Critical)
- `event.category = "Storage"`
- `event.u_component_type = "Controller"`
- `event.assignment_group = "Storage-Support"`
- `event.u_service_tag = "XYZ5678"`
- `event.u_system_model = "PowerEdge R640"`

### Test Case 3: Temperature Warning
```json
{
  "source": "web-server-03",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 555666777\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.10892.1.0.1051\n1.3.6.1.2.1.1.5.0 = web-server-03\n1.3.6.1.4.1.674.10892.1.300.10.1.11.1 = DEF9012\n1.3.6.1.4.1.674.10892.1.300.10.1.9.1 = PowerEdge R740\n1.3.6.1.4.1.674.10892.1.700.20.1.5.1 = 4\n1.3.6.1.4.1.674.10892.1.700.20.1.6.1 = 75C\n1.3.6.1.4.1.674.10892.5.1.1.6.0 = 5.00.10.00"
}
```

**Expected Results:**
- `event.source = "web-server-03"`
- `event.node = "web-server-03"`
- `event.severity = 2` (Major - from trap, but could be 4 from status code)
- `event.category = "Hardware"`
- `event.u_component_type = "Temperature"`
- `event.assignment_group = "Hardware-Server-Support"`
- `event.u_temperature_reading = "75C"`

### Test Case 4: Network Interface Down
```json
{
  "source": "app-server-04-mgmt",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 111222333\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.10892.1.0.1451\n1.3.6.1.2.1.1.5.0 = app-server-04-mgmt\n1.3.6.1.4.1.674.10892.1.300.10.1.11.1 = GHI3456\n1.3.6.1.4.1.674.10892.1.300.10.1.9.1 = PowerEdge R730\n1.3.6.1.4.1.674.10892.1.1200.10.1.3.1 = 4\n1.3.6.1.4.1.674.10892.5.1.1.6.0 = 2.85.85.85"
}
```

**Expected Results:**
- `event.source = "app-server-04"`
- `event.node = "app-server-04"`
- `event.severity = 2` (Major)
- `event.category = "Network"`
- `event.u_component_type = "NIC"`
- `event.assignment_group = "Network-Support"`
- `event.u_service_tag = "GHI3456"`

### Test Case 5: iDRAC Authentication Failure
```json
{
  "source": "file-server-05-oob",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 777888999\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.10892.5.0.2003\n1.3.6.1.2.1.1.5.0 = file-server-05-oob\n1.3.6.1.4.1.674.10892.1.300.10.1.11.1 = JKL7890\n1.3.6.1.4.1.674.10892.1.300.10.1.9.1 = PowerEdge R650\n1.3.6.1.4.1.674.10892.5.1.1.6.0 = 6.00.00.00\n1.3.6.1.4.1.674.10892.5.1.1.5.0 = https://192.168.1.100"
}
```

**Expected Results:**
- `event.source = "file-server-05"`
- `event.node = "file-server-05"`
- `event.severity = 2` (Major)
- `event.category = "Security"`
- `event.u_component_type = "Authentication"`
- `event.assignment_group = "Server-Management"`
- `event.u_idrac_url = "https://192.168.1.100"`

### Test Case 6: System Boot Complete (Info Event)
```json
{
  "source": "backup-server-06r",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 444555666\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.10892.1.0.1601\n1.3.6.1.2.1.1.5.0 = backup-server-06r\n1.3.6.1.4.1.674.10892.1.300.10.1.11.1 = MNO2468\n1.3.6.1.4.1.674.10892.1.300.10.1.9.1 = PowerEdge T650\n1.3.6.1.4.1.674.10892.1.300.10.1.5.1 = 2.18.0\n1.3.6.1.4.1.674.10892.5.1.1.6.0 = 6.10.80.00"
}
```

**Expected Results:**
- `event.source = "backup-server-06"`
- `event.node = "backup-server-06"`
- `event.severity = 5` (Info)
- `event.category = "System"`
- `event.u_component_type = "Boot"`
- `event.assignment_group = "Hardware-Server-Support"`
- `event.u_bios_version = "2.18.0"`

## Hostname Cleaning Test Cases

### Test Case 7: Various iDRAC Suffix Patterns
```json
{
  "test_hostnames": [
    {
      "input": "server01-idrac",
      "expected": "server01",
      "description": "Standard iDRAC suffix"
    },
    {
      "input": "webserver-drac",
      "expected": "webserver",
      "description": "DRAC suffix"
    },
    {
      "input": "dbserver-mgmt",
      "expected": "dbserver",
      "description": "Management suffix"
    },
    {
      "input": "appserver-oob",
      "expected": "appserver",
      "description": "Out-of-band suffix"
    },
    {
      "input": "fileserverr",
      "expected": "fileserver",
      "description": "Single 'r' suffix"
    },
    {
      "input": "backup-server-r",
      "expected": "backup-server",
      "description": "Hyphenated 'r' suffix"
    },
    {
      "input": "mail-server-bmc",
      "expected": "mail-server",
      "description": "BMC suffix"
    },
    {
      "input": "dns-server-ipmi",
      "expected": "dns-server",
      "description": "IPMI suffix"
    },
    {
      "input": "normal-server",
      "expected": "normal-server",
      "description": "No cleaning needed"
    }
  ]
}
```

## Component-Based Assignment Group Testing

### Test Case 8: Assignment Group Validation
```json
{
  "assignment_tests": [
    {
      "trap_oid": "1.3.6.1.4.1.674.10892.1.0.1304",
      "category": "Storage",
      "expected_group": "Storage-Support",
      "description": "Storage controller failure"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.10892.1.0.1451",
      "category": "Network",
      "expected_group": "Network-Support",
      "description": "Network interface down"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.10892.5.0.2003",
      "category": "Security",
      "expected_group": "Server-Management",
      "description": "iDRAC authentication failure"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.10892.1.0.1106",
      "category": "Hardware",
      "expected_group": "Hardware-Server-Support",
      "description": "Power supply critical failure"
    }
  ]
}
```

## Severity Mapping Tests

### Test Case 9: Status Code to Severity Mapping
```json
{
  "severity_tests": [
    {
      "component": "Power",
      "status_code": 5,
      "expected_severity": 1,
      "description": "Power supply critical status"
    },
    {
      "component": "Temperature",
      "status_code": 4,
      "expected_severity": 4,
      "description": "Temperature non-critical upper"
    },
    {
      "component": "Temperature",
      "status_code": 5,
      "expected_severity": 1,
      "description": "Temperature critical upper"
    },
    {
      "component": "General",
      "status_code": 3,
      "expected_severity": 5,
      "description": "Component OK status"
    }
  ]
}
```

## iDRAC Version Detection Tests

### Test Case 10: Version Detection from Model
```json
{
  "version_tests": [
    {
      "model": "PowerEdge R750",
      "expected_version": "9/10",
      "description": "15th generation server"
    },
    {
      "model": "PowerEdge R740",
      "expected_version": "8/9",
      "description": "14th generation server"
    },
    {
      "model": "PowerEdge R730",
      "expected_version": "7/8",
      "description": "13th generation server"
    },
    {
      "idrac_version": "6.10.30.00",
      "expected_version": "9/10",
      "description": "iDRAC 9 firmware"
    },
    {
      "idrac_version": "5.10.50.00",
      "expected_version": "8/9",
      "description": "iDRAC 8 firmware"
    }
  ]
}
```

## Custom Field Extraction Tests

### Test Case 11: Dell-Specific Field Extraction
```json
{
  "field_tests": [
    {
      "field": "u_service_tag",
      "oid": "1.3.6.1.4.1.674.10892.1.300.10.1.11.1",
      "test_value": "ABC1234",
      "description": "Service tag extraction"
    },
    {
      "field": "u_express_service_code",
      "oid": "1.3.6.1.4.1.674.10892.1.300.10.1.12.1",
      "test_value": "567-890-123",
      "description": "Express service code extraction"
    },
    {
      "field": "u_system_model",
      "oid": "1.3.6.1.4.1.674.10892.1.300.10.1.9.1",
      "test_value": "PowerEdge R750",
      "description": "System model extraction"
    },
    {
      "field": "u_temperature_reading",
      "oid": "1.3.6.1.4.1.674.10892.1.700.20.1.6.1",
      "test_value": "75C",
      "description": "Temperature reading extraction"
    },
    {
      "field": "u_fan_speed",
      "oid": "1.3.6.1.4.1.674.10892.1.700.12.1.6.1",
      "test_value": "2400 RPM",
      "description": "Fan speed extraction"
    }
  ]
}
```

## Integration Testing Scenarios

### Test Case 12: End-to-End Workflow
1. **Event Generation**: Create test event with Dell trap OID
2. **Event Rule Execution**: Verify condition script detects Dell enterprise OID
3. **Advanced Script Processing**: Confirm JavaScript execution without errors
4. **Field Mapping**: Validate all custom fields are populated correctly
5. **Assignment**: Check correct assignment group routing
6. **Correlation**: Verify correlation ID generation
7. **Work Notes**: Confirm work notes include relevant details

### Test Case 13: Error Handling
```json
{
  "error_tests": [
    {
      "scenario": "Missing varbinds",
      "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.10892.1.0.1106",
      "expected_behavior": "Graceful handling with default values"
    },
    {
      "scenario": "Invalid status codes",
      "status_code": "99",
      "expected_behavior": "Use trap severity as fallback"
    },
    {
      "scenario": "Empty hostname",
      "sysName": "",
      "expected_behavior": "Use fallback sources or default"
    }
  ]
}
```

## Performance Testing

### Test Case 14: High Volume Testing
- **Volume**: 1000 events per minute
- **Concurrency**: Multiple Dell servers
- **Monitoring**: Event processing times
- **Validation**: No missed events, correct processing

### Test Case 15: Memory Usage
- **Duration**: 24-hour continuous testing
- **Monitoring**: Memory consumption patterns
- **Validation**: No memory leaks in JavaScript processing

## Validation Checklist

### Functional Testing
- [ ] All trap OIDs are correctly mapped
- [ ] Severity mapping works for all components
- [ ] Assignment group routing is accurate
- [ ] Hostname cleaning removes all tested suffixes
- [ ] Custom fields are populated correctly
- [ ] Dell-specific information is extracted
- [ ] iDRAC version detection works
- [ ] Status code analysis functions properly

### Integration Testing
- [ ] Events flow from Dell servers to ServiceNow
- [ ] Event rules execute without errors
- [ ] CMDB correlation works with service tags
- [ ] Assignment groups exist and are accessible
- [ ] Notification rules trigger appropriately
- [ ] Dashboard widgets display correct data

### Performance Testing
- [ ] Event processing completes within SLA
- [ ] No performance degradation under load
- [ ] Memory usage remains stable
- [ ] Database performance is acceptable

### Security Testing
- [ ] SNMP authentication works correctly
- [ ] No sensitive data is logged
- [ ] Access controls are properly implemented
- [ ] Event data is properly sanitized

## Automated Testing Script

```javascript
// ServiceNow Test Script for Dell iDRAC Handler
function testDellTrapHandler() {
    var testEvents = [
        {
            name: "Power Supply Critical",
            trapOID: "1.3.6.1.4.1.674.10892.1.0.1106",
            expectedSeverity: 1,
            expectedCategory: "Hardware",
            expectedAssignment: "Hardware-Server-Support"
        },
        {
            name: "Storage Controller Failure",
            trapOID: "1.3.6.1.4.1.674.10892.1.0.1304",
            expectedSeverity: 1,
            expectedCategory: "Storage",
            expectedAssignment: "Storage-Support"
        }
        // Add more test cases...
    ];
    
    testEvents.forEach(function(test) {
        gs.log("Testing: " + test.name, "Dell Test");
        // Create test event and validate results
        // Implementation details would go here
    });
}
```

This comprehensive test suite ensures the Dell iDRAC trap handler works correctly across all scenarios and provides reliable event processing for Dell server management in ServiceNow ITOM.