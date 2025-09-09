# HP iLO Hostname-Based Assignment Group Routing Test Examples

## Overview
This document provides test examples for the HP iLO SNMP trap handler's hostname-based assignment group routing functionality. The routing logic prioritizes hostname patterns over Dynamic CI Grouping.

## Hostname Routing Rules

### Rule 1: `-con` Pattern → UNIX-SUPPORT
- **Pattern**: Hostname contains `-con` (case-insensitive)
- **Examples**: `hostname-con`, `hostname-con-ilo`, `prod-web-con-mgmt`
- **Target Group**: `UNIX-SUPPORT`
- **Priority**: Highest (before Dynamic CI Grouping)
- **Hostname Cleaning**: Management suffixes are removed from event.node

### Rule 2: `r` Pattern → WINDOWS-SERVER-TEAM  
- **Pattern**: Hostname contains `r` (case-insensitive)
- **Examples**: `hostnamer`, `hostnamer-ilo`, `router-mgmt`, `server01r`
- **Target Group**: `WINDOWS-SERVER-TEAM`
- **Priority**: High (before Dynamic CI Grouping, after `-con` check)
- **Hostname Cleaning**: Management suffixes are removed from event.node

### Rule 3: No Pattern Match → Dynamic CI Grouping
- **Fallback**: Uses existing Dynamic CI Grouping logic
- **Final Fallback**: Component-based static assignment

## Test Scenarios

### Scenario 1: UNIX Systems with -con Pattern

#### Test Case 1.1: Standard -con Hostname
```json
{
  "input": {
    "source": "server01-con-ilo",
    "additional_info": "1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.136001004\n1.3.6.1.2.1.1.5.0 = server01-con-ilo"
  },
  "expected_output": {
    "assignment_group": "UNIX-SUPPORT",
    "routing_reason": "Hostname ends with -con pattern",
    "event_source": "server01",
    "event_node": "server01"
  },
  "log_message": "HP iLO hostname contains -con pattern, routing to UNIX-SUPPORT: server01-con-ilo"
}
```

#### Test Case 1.2: -con with Different Variations
```json
{
  "test_cases": [
    {
      "original_hostname": "prod-web-con",
      "cleaned_hostname": "prod-web",
      "expected_group": "UNIX-SUPPORT",
      "description": "Production web server with -con"
    },
    {
      "original_hostname": "DB-CON-ILO",
      "cleaned_hostname": "DB", 
      "expected_group": "UNIX-SUPPORT",
      "description": "Database server with uppercase -CON-ILO"
    },
    {
      "original_hostname": "app-con-mgmt",
      "cleaned_hostname": "app",
      "expected_group": "UNIX-SUPPORT",
      "description": "Application server with -con-mgmt suffix"
    },
    {
      "original_hostname": "backup-con-oob",
      "cleaned_hostname": "backup",
      "expected_group": "UNIX-SUPPORT",
      "description": "Backup server with -con-oob suffix"
    }
  ]
}
```

### Scenario 2: Windows Systems with r Pattern

#### Test Case 2.1: Standard r Pattern
```json
{
  "input": {
    "source": "server01r-ilo",
    "additional_info": "1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.136001004\n1.3.6.1.2.1.1.5.0 = server01r-ilo"
  },
  "expected_output": {
    "assignment_group": "WINDOWS-SERVER-TEAM",
    "routing_reason": "Hostname ends with r pattern",
    "event_source": "server01",
    "event_node": "server01"
  },
  "log_message": "HP iLO hostname contains r pattern, routing to WINDOWS-SERVER-TEAM: server01r-ilo"
}
```

#### Test Case 2.2: Various r Pattern Variations
```json
{
  "test_cases": [
    {
      "original_hostname": "prod-webr",
      "cleaned_hostname": "prod-web",
      "expected_group": "WINDOWS-SERVER-TEAM",
      "description": "Production web server with r suffix"
    },
    {
      "original_hostname": "sqlr-ilo",
      "cleaned_hostname": "sql",
      "expected_group": "WINDOWS-SERVER-TEAM",
      "description": "SQL server with r-ilo suffix"
    },
    {
      "original_hostname": "router-mgmt",
      "cleaned_hostname": "router",
      "expected_group": "WINDOWS-SERVER-TEAM",
      "description": "Router with r in hostname"
    },
    {
      "original_hostname": "srv-cluster01",
      "cleaned_hostname": "srv-cluster01",
      "expected_group": "WINDOWS-SERVER-TEAM",
      "description": "Cluster server with r in srv"
    }
  ]
}
```

### Scenario 3: Priority Testing (-con takes precedence over r)

#### Test Case 3.1: Both Patterns Present
```json
{
  "input": {
    "source": "serverr-con-ilo",
    "additional_info": "1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.136001004\n1.3.6.1.2.1.1.5.0 = serverr-con-ilo"
  },
  "expected_output": {
    "assignment_group": "UNIX-SUPPORT",
    "routing_reason": "-con pattern has higher priority than r pattern",
    "event_source": "server",
    "event_node": "server"
  },
  "description": "When both r and -con are present, -con takes precedence"
}
```

### Scenario 4: No Pattern Match - Falls Back to Dynamic CI Grouping

#### Test Case 4.1: Standard Server Without Patterns
```json
{
  "input": {
    "source": "web01-ilo",
    "additional_info": "1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.136001004\n1.3.6.1.2.1.1.5.0 = web01-ilo"
  },
  "expected_behavior": {
    "hostname_routing": "No match",
    "fallback_to": "Dynamic CI Grouping",
    "final_fallback": "Component-based assignment (Hardware-Server-Support)",
    "event_source": "web01",
    "event_node": "web01"
  },
  "description": "Standard hostname uses Dynamic CI Grouping or component fallback"
}
```

#### Test Case 4.2: Various Non-Matching Hostnames
```json
{
  "test_cases": [
    {
      "original_hostname": "db01-ilo",
      "cleaned_hostname": "db01",
      "expected_behavior": "Dynamic CI Grouping → Component fallback",
      "description": "Database server without special patterns"
    },
    {
      "original_hostname": "app-server-mgmt",
      "cleaned_hostname": "app-server", 
      "expected_behavior": "Dynamic CI Grouping → Component fallback",
      "description": "Application server with mgmt suffix only"
    },
    {
      "original_hostname": "backup01-oob",
      "cleaned_hostname": "backup01",
      "expected_behavior": "Dynamic CI Grouping → Component fallback", 
      "description": "Backup server with oob suffix only"
    }
  ]
}
```

## Implementation Logic Flow

```
1. getOriginalHostname() - Get uncleaned hostname from SNMP varbinds
2. getHostnameBasedAssignmentGroup()
   ├── Check for '-con' pattern anywhere in hostname (case-insensitive)
   │   └── If found: Return 'UNIX-SUPPORT'
   ├── Check for 'r' pattern anywhere in hostname (case-insensitive)  
   │   └── If found: Return 'WINDOWS-SERVER-TEAM'
   └── No pattern: Return null
3. getSourceNode() - Clean hostname for event.node and event.source
4. If hostname routing returns null:
   └── Continue to Dynamic CI Grouping
       ├── Query CMDB for CI
       ├── Check CI grouping rules
       ├── Check business service relationships
       └── Fallback to component-based assignment
```

## Testing Commands for ServiceNow

### Create Test Event with -con Pattern
```javascript
// Test -con hostname routing
var testEvent = {
    source: 'prod-web-con-ilo',
    additional_info: '1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.136001004\n1.3.6.1.2.1.1.5.0 = prod-web-con-ilo'
};

// Expected: assignment_group = 'UNIX-SUPPORT', event.node = 'prod-web'
```

### Create Test Event with r Pattern
```javascript
// Test r hostname routing  
var testEvent = {
    source: 'sqlr-ilo',
    additional_info: '1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.136001004\n1.3.6.1.2.1.1.5.0 = sqlr-ilo'
};

// Expected: assignment_group = 'WINDOWS-SERVER-TEAM', event.node = 'sql'
```

### Create Test Event with No Pattern
```javascript
// Test fallback behavior
var testEvent = {
    source: 'web01-ilo', 
    additional_info: '1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.136001004\n1.3.6.1.2.1.1.5.0 = web01-ilo'
};

// Expected: Falls back to Dynamic CI Grouping, event.node = 'web01'
```

## Validation Checklist

### Hostname Pattern Detection
- [ ] `-con` pattern detected correctly anywhere in hostname (case-insensitive)
- [ ] `r` pattern detected correctly anywhere in hostname (case-insensitive)
- [ ] `-con` takes precedence over `r` when both present
- [ ] Patterns work with various management suffixes (-ilo, -mgmt, -oob, etc.)
- [ ] 'r' pattern matches in middle of hostname (router, cluster, etc.)

### Assignment Group Routing
- [ ] `UNIX-SUPPORT` assigned for `-con` hostnames
- [ ] `WINDOWS-SERVER-TEAM` assigned for `r` hostnames
- [ ] Dynamic CI Grouping used when no patterns match
- [ ] Component-based fallback works correctly

### Hostname Cleaning
- [ ] Original hostname used for pattern detection
- [ ] Cleaned hostname populated in event.node and event.source
- [ ] Management suffixes properly removed (-ilo, -mgmt, -oob, etc.)
- [ ] `-con` and `r` patterns properly cleaned from final hostname
- [ ] Fallback to original hostname if cleaning results in empty string

### Logging and Debug
- [ ] Hostname routing decisions logged with original hostname
- [ ] Log messages include source hostname for troubleshooting
- [ ] No errors in ServiceNow system logs
- [ ] Event processing completes successfully

## Common Hostname Examples by Category

### UNIX Systems (-con Pattern)
```
Original Hostnames    →    Cleaned Hostnames    →    Assignment Group
prod-web-con         →    prod-web            →    UNIX-SUPPORT
db-con-ilo          →    db                  →    UNIX-SUPPORT 
app-server-con-mgmt →    app-server          →    UNIX-SUPPORT
backup-con-oob      →    backup              →    UNIX-SUPPORT
DEV-CON-ILO         →    DEV                 →    UNIX-SUPPORT (case insensitive)
test-con-drac       →    test                →    UNIX-SUPPORT
```

### Windows Systems (r Pattern)  
```
Original Hostnames    →    Cleaned Hostnames    →    Assignment Group
server01r           →    server01            →    WINDOWS-SERVER-TEAM
sqlr-ilo           →    sql                 →    WINDOWS-SERVER-TEAM
webr-mgmt          →    web                 →    WINDOWS-SERVER-TEAM
dcr-oob            →    dc                  →    WINDOWS-SERVER-TEAM
appr-idrac         →    app                 →    WINDOWS-SERVER-TEAM
srv01r-bmc         →    srv01               →    WINDOWS-SERVER-TEAM
```

### No Pattern (Dynamic CI Grouping)
```
Original Hostnames    →    Cleaned Hostnames    →    Routing Method
web01-ilo           →    web01               →    Dynamic CI Grouping
db-primary-mgmt     →    db-primary          →    Dynamic CI Grouping
app-server-oob      →    app-server          →    Dynamic CI Grouping
backup01-bmc        →    backup01            →    Dynamic CI Grouping
test-environment-01 →    test-environment-01 →    Dynamic CI Grouping
load-balancer-ipmi  →    load-balancer       →    Dynamic CI Grouping
```

## Troubleshooting Guide

### Issue: Wrong Assignment Group
1. **Check hostname pattern**: Verify the actual hostname in the event
2. **Case sensitivity**: Pattern matching is case-insensitive
3. **Priority order**: `-con` always takes precedence over `r`
4. **Log review**: Check ServiceNow system logs for routing decisions

### Issue: Pattern Not Detected
1. **Hostname source**: Verify event.node and event.source are populated
2. **Pattern exact match**: Ensure hostname contains exact `-con` or `r` patterns
3. **Clean hostname**: Check if hostname cleaning affects pattern detection
4. **Debug logging**: Enable debug logs to trace pattern matching

### Issue: Fallback Not Working
1. **Dynamic CI Grouping**: Verify CMDB CI exists for the hostname
2. **Component category**: Check trapInfo.category is set correctly  
3. **Assignment groups**: Ensure target assignment groups exist and are active
4. **Rule validation**: Test each routing rule independently

This implementation provides clear, prioritized hostname-based routing for HP iLO events while maintaining backward compatibility with existing Dynamic CI Grouping functionality.