# Dell PowerStore SNMP Trap Test Examples

## Overview
This document provides comprehensive test examples for validating the Dell PowerStore SNMP trap handler implementation in ServiceNow ITOM. It includes test events, expected outcomes, and validation scenarios for storage array monitoring.

## Test Event Examples

### Test Case 1: Critical Array Offline
```json
{
  "source": "powerstore-prod-01",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.1001\n1.3.6.1.2.1.1.5.0 = powerstore-prod-01\n1.3.6.1.4.1.674.11000.2000.10.1.1 = PS987654\n1.3.6.1.4.1.674.11000.2000.10.1.2 = PowerStore 7000T\n1.3.6.1.4.1.674.11000.2000.10.1.4 = 3.0.0.0\n1.3.6.1.4.1.674.11000.2000.20.1.1 = Production-Cluster"
}
```

**Expected Results:**
- `event.source = "powerstore-prod-01"`
- `event.node = "powerstore-prod-01"`
- `event.severity = 1` (Critical)
- `event.category = "Storage"`
- `event.u_component_type = "Array"`
- `event.assignment_group = "Storage-Support"`
- `event.u_array_serial = "PS987654"`
- `event.u_array_model = "PowerStore 7000T"`
- `event.u_software_version = "3.0.0.0"`
- `event.u_cluster_name = "Production-Cluster"`

### Test Case 2: Volume Performance Degraded
```json
{
  "source": "powerstore-dev-02-cluster",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 987654321\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.2001\n1.3.6.1.2.1.1.5.0 = powerstore-dev-02-cluster\n1.3.6.1.4.1.674.11000.2000.10.1.1 = PS123456\n1.3.6.1.4.1.674.11000.2000.10.1.2 = PowerStore 5000T\n1.3.6.1.4.1.674.11000.2000.30.1.1 = oracle-db-vol\n1.3.6.1.4.1.674.11000.2000.40.1.5 = 15.5ms\n1.3.6.1.4.1.674.11000.2000.40.1.6 = 18.2ms"
}
```

**Expected Results:**
- `event.source = "powerstore-dev-02"`
- `event.node = "powerstore-dev-02"`
- `event.severity = 2` (Major)
- `event.category = "Performance"`
- `event.u_component_type = "Volume"`
- `event.assignment_group = "Storage-Performance"`
- `event.u_array_serial = "PS123456"`
- `event.u_volume_name = "oracle-db-vol"`
- `event.u_latency_read = "15.5ms"`
- `event.u_latency_write = "18.2ms"`

### Test Case 3: Host Connectivity Issue
```json
{
  "source": "powerstore-test-03-mgmt",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 555666777\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.2002\n1.3.6.1.2.1.1.5.0 = powerstore-test-03-mgmt\n1.3.6.1.4.1.674.11000.2000.10.1.1 = PS345678\n1.3.6.1.4.1.674.11000.2000.10.1.2 = PowerStore 3000T\n1.3.6.1.4.1.674.11000.2000.60.1.1 = sql-server-01\n1.3.6.1.4.1.674.11000.2000.60.1.4 = 2"
}
```

**Expected Results:**
- `event.source = "powerstore-test-03"`
- `event.node = "powerstore-test-03"`
- `event.severity = 2` (Major)
- `event.category = "Network"`
- `event.u_component_type = "Host"`
- `event.assignment_group = "Network-Support"`
- `event.u_array_serial = "PS345678"`
- `event.u_array_model = "PowerStore 3000T"`

### Test Case 4: Space Usage Warning
```json
{
  "source": "powerstore-backup-04-storage",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 111222333\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.4001\n1.3.6.1.2.1.1.5.0 = powerstore-backup-04-storage\n1.3.6.1.4.1.674.11000.2000.10.1.1 = PS567890\n1.3.6.1.4.1.674.11000.2000.10.1.2 = PowerStore 9000T\n1.3.6.1.4.1.674.11000.2000.30.1.4 = 85%\n1.3.6.1.4.1.674.11000.2000.30.1.5 = 15%"
}
```

**Expected Results:**
- `event.source = "powerstore-backup-04"`
- `event.node = "powerstore-backup-04"`
- `event.severity = 4` (Warning)
- `event.category = "Capacity"`
- `event.u_component_type = "Space"`
- `event.assignment_group = "Storage-Support"`
- `event.u_used_space = "85%"`

### Test Case 5: Volume Creation (Info Event)
```json
{
  "source": "powerstore-lab-05-ps",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 444555666\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.3001\n1.3.6.1.2.1.1.5.0 = powerstore-lab-05-ps\n1.3.6.1.4.1.674.11000.2000.10.1.1 = PS789012\n1.3.6.1.4.1.674.11000.2000.10.1.2 = PowerStore 1000T\n1.3.6.1.4.1.674.11000.2000.30.1.1 = test-volume-001\n1.3.6.1.4.1.674.11000.2000.30.1.2 = 100GB"
}
```

**Expected Results:**
- `event.source = "powerstore-lab-05"`
- `event.node = "powerstore-lab-05"`
- `event.severity = 3` (Minor)
- `event.category = "Storage"`
- `event.u_component_type = "Volume"`
- `event.assignment_group = "Storage-Support"`
- `event.u_volume_name = "test-volume-001"`

### Test Case 6: Replication Failure
```json
{
  "source": "powerstore-dr-06-array",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 777888999\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.1006\n1.3.6.1.2.1.1.5.0 = powerstore-dr-06-array\n1.3.6.1.4.1.674.11000.2000.10.1.1 = PS234567\n1.3.6.1.4.1.674.11000.2000.10.1.2 = PowerStore 7000X\n1.3.6.1.4.1.674.11000.2000.70.1.3 = 3"
}
```

**Expected Results:**
- `event.source = "powerstore-dr-06"`
- `event.node = "powerstore-dr-06"`
- `event.severity = 1` (Critical)
- `event.category = "Storage"`
- `event.u_component_type = "Replication"`
- `event.assignment_group = "Storage-Support"`
- `event.u_array_model = "PowerStore 7000X"`

## Hostname Cleaning Test Cases

### Test Case 7: Various PowerStore Suffix Patterns
```json
{
  "test_hostnames": [
    {
      "input": "powerstore-prod-01",
      "expected": "powerstore-prod-01",
      "description": "No cleaning needed"
    },
    {
      "input": "storage-01-powerstore",
      "expected": "storage-01",
      "description": "PowerStore suffix removal"
    },
    {
      "input": "san-cluster-ps",
      "expected": "san-cluster",
      "description": "PS suffix removal"
    },
    {
      "input": "backup-storage-mgmt",
      "expected": "backup-storage",
      "description": "Management suffix removal"
    },
    {
      "input": "prod-cluster-cluster",
      "expected": "prod-cluster",
      "description": "Cluster suffix removal"
    },
    {
      "input": "array-01-node1",
      "expected": "array-01",
      "description": "Node suffix removal"
    },
    {
      "input": "storage-array-array",
      "expected": "storage-array",
      "description": "Array suffix removal"
    },
    {
      "input": "data-san-san",
      "expected": "data-san",
      "description": "SAN suffix removal"
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
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.1002",
      "category": "Storage",
      "expected_group": "Storage-Support",
      "description": "Volume offline"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.2002",
      "category": "Network",
      "expected_group": "Network-Support",
      "description": "Host connectivity issue"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.2001",
      "category": "Performance",
      "expected_group": "Storage-Performance",
      "description": "Performance degraded"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.3008",
      "category": "Security",
      "expected_group": "Storage-Management",
      "description": "User login event"
    }
  ]
}
```

## Severity Mapping Tests

### Test Case 9: Severity Validation
```json
{
  "severity_tests": [
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.1001",
      "expected_severity": 1,
      "description": "Array offline - Critical"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.2004",
      "expected_severity": 2,
      "description": "Space low warning - Major"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.3001",
      "expected_severity": 3,
      "description": "Volume created - Minor"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.4001",
      "expected_severity": 4,
      "description": "Space usage high - Warning"
    },
    {
      "trap_oid": "1.3.6.1.4.1.674.11000.2000.100.5001",
      "expected_severity": 5,
      "description": "Array online - Info"
    }
  ]
}
```

## Performance Metrics Tests

### Test Case 10: Performance Data Extraction
```json
{
  "performance_tests": [
    {
      "field": "u_iops_read",
      "oid": "1.3.6.1.4.1.674.11000.2000.40.1.1",
      "test_value": "25000",
      "description": "Read IOPS extraction"
    },
    {
      "field": "u_iops_write",
      "oid": "1.3.6.1.4.1.674.11000.2000.40.1.2",
      "test_value": "15000",
      "description": "Write IOPS extraction"
    },
    {
      "field": "u_bandwidth_read",
      "oid": "1.3.6.1.4.1.674.11000.2000.40.1.3",
      "test_value": "500 MB/s",
      "description": "Read bandwidth extraction"
    },
    {
      "field": "u_bandwidth_write",
      "oid": "1.3.6.1.4.1.674.11000.2000.40.1.4",
      "test_value": "300 MB/s",
      "description": "Write bandwidth extraction"
    },
    {
      "field": "u_latency_read",
      "oid": "1.3.6.1.4.1.674.11000.2000.40.1.5",
      "test_value": "2.5ms",
      "description": "Read latency extraction"
    },
    {
      "field": "u_latency_write",
      "oid": "1.3.6.1.4.1.674.11000.2000.40.1.6",
      "test_value": "4.1ms",
      "description": "Write latency extraction"
    }
  ]
}
```

## Custom Field Extraction Tests

### Test Case 11: PowerStore-Specific Field Extraction
```json
{
  "field_tests": [
    {
      "field": "u_array_serial",
      "oid": "1.3.6.1.4.1.674.11000.2000.10.1.1",
      "test_value": "PS123456",
      "description": "Array serial number extraction"
    },
    {
      "field": "u_array_model",
      "oid": "1.3.6.1.4.1.674.11000.2000.10.1.2",
      "test_value": "PowerStore 7000T",
      "description": "Array model extraction"
    },
    {
      "field": "u_cluster_name",
      "oid": "1.3.6.1.4.1.674.11000.2000.20.1.1",
      "test_value": "Production-Cluster",
      "description": "Cluster name extraction"
    },
    {
      "field": "u_volume_name",
      "oid": "1.3.6.1.4.1.674.11000.2000.30.1.1",
      "test_value": "oracle-data-vol",
      "description": "Volume name extraction"
    },
    {
      "field": "u_software_version",
      "oid": "1.3.6.1.4.1.674.11000.2000.10.1.4",
      "test_value": "3.0.0.0",
      "description": "Software version extraction"
    }
  ]
}
```

## Integration Testing Scenarios

### Test Case 12: End-to-End Workflow
1. **Event Generation**: Create test event with PowerStore trap OID
2. **Event Rule Execution**: Verify condition script detects PowerStore enterprise OID
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
      "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.674.11000.2000.100.1001",
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
- **Volume**: 500 events per minute
- **Concurrency**: Multiple PowerStore arrays
- **Monitoring**: Event processing times
- **Validation**: No missed events, correct processing

### Test Case 15: Large Array Testing
- **Scenario**: PowerStore arrays with 1000+ volumes
- **Event Types**: Volume creation, deletion, modification events
- **Monitoring**: Memory consumption patterns
- **Validation**: No performance degradation

## Validation Checklist

### Functional Testing
- [ ] All trap OIDs are correctly mapped
- [ ] Severity mapping works for all components
- [ ] Assignment group routing is accurate
- [ ] Hostname cleaning removes all tested suffixes
- [ ] Custom fields are populated correctly
- [ ] PowerStore-specific information is extracted
- [ ] Performance metrics are captured
- [ ] Capacity information is accurate

### Integration Testing
- [ ] Events flow from PowerStore arrays to ServiceNow
- [ ] Event rules execute without errors
- [ ] CMDB correlation works with array serials
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
// ServiceNow Test Script for Dell PowerStore Handler
function testPowerStoreTrapHandler() {
    var testEvents = [
        {
            name: "Array Offline Critical",
            trapOID: "1.3.6.1.4.1.674.11000.2000.100.1001",
            expectedSeverity: 1,
            expectedCategory: "Storage",
            expectedAssignment: "Storage-Support"
        },
        {
            name: "Performance Degraded",
            trapOID: "1.3.6.1.4.1.674.11000.2000.100.2001",
            expectedSeverity: 2,
            expectedCategory: "Performance",
            expectedAssignment: "Storage-Performance"
        },
        {
            name: "Volume Created",
            trapOID: "1.3.6.1.4.1.674.11000.2000.100.3001",
            expectedSeverity: 3,
            expectedCategory: "Storage",
            expectedAssignment: "Storage-Support"
        }
        // Add more test cases...
    ];
    
    testEvents.forEach(function(test) {
        gs.log("Testing: " + test.name, "PowerStore Test");
        // Create test event and validate results
        // Implementation details would go here
    });
}
```

This comprehensive test suite ensures the Dell PowerStore trap handler works correctly across all scenarios and provides reliable event processing for Dell PowerStore storage management in ServiceNow ITOM.