# HP iLO Hostname Cleaning Test Examples

## Overview
The updated HP trap handler now includes intelligent hostname extraction and cleaning functionality to handle various iLO naming conventions. This document provides test examples demonstrating how different hostname formats are processed.

## Hostname Cleaning Functionality

### Supported Suffix Patterns
The handler automatically removes the following suffixes from hostnames:
- `-con` (hostname-con)
- `-ilo` (hostname-ilo)
- `-mgmt` (hostname-mgmt)
- `-ipmi` (hostname-ipmi)
- `-bmc` (hostname-bmc)
- `-idrac` (hostname-idrac)
- `r` (hostnamer - single 'r' suffix)
- `-r` (hostname-r)
- `-oob` (hostname-oob - out of band)
- `-mgt` (hostname-mgt - management)
- `-drac` (hostname-drac)

### Processing Logic
1. **Primary Source**: Extract hostname from `sysName` varbind
2. **Secondary Sources**: Try HP-specific OIDs (`cpqSiProductName`, `cpqSiServerSystemId`)
3. **Fallback**: Use event source field
4. **Cleaning**: Apply suffix removal patterns
5. **Validation**: Ensure cleaned name is not empty

## Test Examples

### Test Case 1: Common iLO Naming Conventions
```json
{
  "input_hostnames": [
    "server01-con",
    "webserver-ilo", 
    "dbserver-mgmt",
    "appserver-ipmi",
    "fileserver-bmc"
  ],
  "expected_output": [
    "server01",
    "webserver",
    "dbserver", 
    "appserver",
    "fileserver"
  ]
}
```

### Test Case 2: Single Character Suffixes
```json
{
  "input_hostnames": [
    "server01r",
    "webserver-r",
    "dbserver-oob",
    "appserver-mgt"
  ],
  "expected_output": [
    "server01",
    "webserver",
    "dbserver",
    "appserver"
  ]
}
```

### Test Case 3: Dell Compatibility
```json
{
  "input_hostnames": [
    "server01-idrac",
    "webserver-drac"
  ],
  "expected_output": [
    "server01",
    "webserver"
  ]
}
```

### Test Case 4: Edge Cases
```json
{
  "input_hostnames": [
    "server-con-prod",
    "test-server-ilo",
    "server01-",
    "server01.",
    "server01-con-"
  ],
  "expected_output": [
    "server-con-prod",
    "test-server",
    "server01",
    "server01",
    "server01-con"
  ]
}
```

### Test Case 5: No Suffix (Pass-through)
```json
{
  "input_hostnames": [
    "server01",
    "web-server-01",
    "database-primary"
  ],
  "expected_output": [
    "server01",
    "web-server-01", 
    "database-primary"
  ]
}
```

## Sample SNMP Trap Events

### Example 1: Server with -con suffix
```json
{
  "source": "Unknown",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.1011\n1.3.6.1.2.1.1.5.0 = webserver01-con\n1.3.6.1.4.1.232.2.2.4.2 = ProLiant DL380 Gen10\n1.3.6.1.4.1.232.11.2.16.4 = ABC1234567"
}
```
**Expected Result:**
- `event.source = "webserver01"`
- `event.node = "webserver01"`

### Example 2: Server with r suffix
```json
{
  "source": "Unknown", 
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 987654321\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.2320.2011\n1.3.6.1.2.1.1.5.0 = dbserver02r\n1.3.6.1.4.1.232.2.2.4.2 = ProLiant DL360 Gen9\n1.3.6.1.4.1.232.11.2.16.4 = XYZ9876543"
}
```
**Expected Result:**
- `event.source = "dbserver02"`
- `event.node = "dbserver02"`

### Example 3: Server with -ilo suffix
```json
{
  "source": "Unknown",
  "type": "snmptrap", 
  "additional_info": "1.3.6.1.2.1.1.3.0 = 555666777\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.3.3002\n1.3.6.1.2.1.1.5.0 = fileserver-ilo\n1.3.6.1.4.1.232.2.2.4.2 = ProLiant ML350 Gen10\n1.3.6.1.4.1.232.11.2.16.4 = DEF5551234"
}
```
**Expected Result:**
- `event.source = "fileserver"`
- `event.node = "fileserver"`

## Implementation Benefits

### 1. **Consistent Node Identification**
- Ensures consistent server identification across monitoring systems
- Correlates events properly with CMDB entries
- Reduces confusion from iLO naming conventions

### 2. **Multiple Source Fallback**
- Primary: `sysName` from SNMP standard OID
- Secondary: HP-specific product name OIDs
- Tertiary: Event source field
- Prevents missing node information

### 3. **Robust Suffix Handling**
- Handles multiple vendor conventions (HP, Dell)
- Case-insensitive matching
- Prevents over-cleaning with single suffix removal
- Validates output to avoid empty strings

### 4. **ServiceNow Integration**
- Populates both `source` and `node` fields consistently
- Improves asset correlation accuracy
- Enhances CMDB integration
- Facilitates proper incident routing

## Testing Validation

### Manual Testing Steps
1. Create test events with various hostname patterns
2. Execute the HP trap handler script
3. Verify `event.source` and `event.node` fields contain cleaned hostnames
4. Check work notes for hostname cleaning confirmation
5. Validate correlation IDs use cleaned hostnames

### Automated Testing
```javascript
// Test function to validate hostname cleaning
function testHostnameCleaning() {
    var testCases = [
        { input: "server01-con", expected: "server01" },
        { input: "webserverr", expected: "webserver" },
        { input: "db-server-ilo", expected: "db-server" },
        { input: "app-mgmt", expected: "app" },
        { input: "normal-server", expected: "normal-server" }
    ];
    
    testCases.forEach(function(test) {
        var result = cleanHostname(test.input);
        console.log("Input: " + test.input + " -> Output: " + result + " (Expected: " + test.expected + ")");
    });
}
```

## Deployment Notes

### Configuration Requirements
- No additional ServiceNow configuration required
- Works with existing HP trap handler implementation
- Compatible with current event rule conditions

### Monitoring
- Work notes include hostname cleaning confirmation
- Correlation IDs reflect cleaned hostnames
- Assignment group routing unaffected

### Rollback Plan
If issues arise, the original hostname extraction can be restored by reverting to the simple `sysName` extraction without cleaning functionality.