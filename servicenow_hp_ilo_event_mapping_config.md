# ServiceNow ITOM Event Field Mapping Configuration for HP/HPE iLO 4/5

## Event Field Mapping Setup Instructions

### 1. Create New Event Rule for HP iLO Traps

Navigate to: **Event Management > Processing > Event Rules**

#### Basic Configuration:
- **Name**: HP iLO 4/5 SNMP Trap Handler
- **Table**: Event [em_event]
- **Active**: True
- **Order**: 110 (after NetApp rule if both are implemented)

#### Conditions:
```javascript
// Condition Script - Check for HP Enterprise OID
var hpOID = '1.3.6.1.4.1.232';
var trapOID = current.additional_info.toString();
trapOID.indexOf(hpOID) >= 0
```

### 2. Field Mapping Configuration

#### Transform Map Settings:
- **Source Table**: Event [em_event]
- **Target Table**: Incident [incident] or Alert [em_alert]
- **Active**: True

#### Field Mappings:

| Target Field | Source/Script | Type | Notes |
|--------------|---------------|------|-------|
| source | Script | Advanced | Extract from sysName varbind |
| node | Script | Advanced | Same as source |
| type | "HP iLO Hardware Alert" | Fixed | |
| severity | Script | Advanced | Based on component status |
| description | Script | Advanced | Include trap OID and status |
| short_description | Script | Advanced | Component + node name |
| assignment_group | Script | Advanced | Component-based routing |
| category | Script | Advanced | Hardware/Storage/Network/System |
| subcategory | Script | Advanced | iLO version detection |
| priority | Script | Advanced | Map from severity |
| impact | Script | Advanced | Component criticality based |
| urgency | Script | Advanced | Severity + component based |

### 3. Custom Fields Configuration

Add the following custom fields to the Event table:

| Field Name | Type | Label | Max Length | Description |
|------------|------|-------|------------|-------------|
| u_vendor | String | Vendor | 40 | Always "HP/HPE" |
| u_serial_number | String | Serial Number | 100 | System serial number |
| u_system_id | String | System ID | 100 | HP system identifier |
| u_system_uptime | String | System Uptime | 100 | System running time |
| u_component_type | String | Component Type | 50 | CPU/Power/Memory/Storage etc |
| u_memory_errors | String | Memory Errors | 50 | Correctable memory error count |
| u_snmp_varbinds | String (Large) | SNMP Varbinds | 4000 | Complete varbind data |

### 4. Assignment Group Configuration

Create or verify the following assignment groups exist:

#### Primary Groups:
- **Hardware-Server-Support**: General hardware issues
- **Storage-Support**: Storage-related alerts
- **Network-Support**: Network interface issues  
- **Server-Management**: iLO and management issues

#### Group Setup:
Navigate to: **User Administration > Groups**

For each group:
- **Type**: itil
- **Description**: Appropriate description for team responsibilities
- **Active**: True
- **Include members**: Add appropriate team members

### 5. Component-Based Assignment Logic

The script automatically routes events based on component type:

| Component Category | Assignment Group | Trap Examples |
|-------------------|------------------|---------------|
| Storage | Storage-Support | Drive failures, controller issues |
| Network | Network-Support | NIC issues, virus detection |
| Management | Server-Management | iLO events, system logs |
| Hardware (Default) | Hardware-Server-Support | CPU, memory, power, cooling |

### 6. Severity Mapping Logic

#### Status Code Processing:
The script analyzes component-specific status codes:

**Power Supply Status Codes:**
- 1 (No Error) → Info (5)
- 2 (General Failure) → Major (2)
- 3 (BIST Failure) → Major (2)
- 4 (Fan Failure) → Major (2)
- 5 (Temperature Failure) → Critical (1)
- 6 (Interlock Open) → Minor (3)

**Temperature Status Codes:**
- 1 (Other) → Minor (3)
- 2 (OK) → Info (5)
- 3 (Degraded/Warning) → Warning (4)
- 4 (Failed/Critical) → Critical (1)

**General Component Status:**
- 1 (Other) → Minor (3)
- 2 (OK) → Info (5)
- 3 (Degraded) → Warning (4)
- 4 (Failed) → Major (2)
- 5 (Missing) → Minor (3)

### 7. Impact and Urgency Matrix

| Component Type | Critical | Major | Minor | Warning |
|----------------|----------|-------|-------|---------|
| CPU/Power/System | Impact:1, Urgency:1 | Impact:2, Urgency:2 | Impact:3, Urgency:3 | Impact:4, Urgency:4 |
| Memory/Temperature | Impact:1, Urgency:1 | Impact:2, Urgency:2 | Impact:3, Urgency:3 | Impact:4, Urgency:4 |
| Storage/Network | Impact:2, Urgency:1 | Impact:3, Urgency:2 | Impact:3, Urgency:3 | Impact:4, Urgency:4 |
| Other Components | Impact:2, Urgency:1 | Impact:3, Urgency:2 | Impact:3, Urgency:3 | Impact:4, Urgency:4 |

### 8. Event Rule Actions

#### Action Type: Transform Event
- **Transform Map**: HP iLO SNMP Transform
- **Advanced Script**: Use the provided JavaScript from servicenow_hp_ilo_trap_handler.js

#### Advanced Script Configuration:
1. Copy the entire script content
2. Paste into the "Advanced Script" field
3. Ensure proper JavaScript validation
4. Test with sample events

### 9. Correlation Rules

Create correlation rules to group related HP events:

#### Hardware Correlation Rule:
- **Name**: HP Hardware Component Correlation
- **Table**: Event [em_event]
- **Conditions**: 
  ```javascript
  current.u_vendor == 'HP/HPE' && 
  current.category == 'Hardware'
  ```
- **Correlation Fields**: source, u_component_type
- **Time Window**: 10 minutes

#### System Correlation Rule:
- **Name**: HP System Event Correlation  
- **Table**: Event [em_event]
- **Conditions**:
  ```javascript
  current.source.toString().indexOf('HP') >= 0 ||
  current.u_vendor == 'HP/HPE'
  ```
- **Correlation Fields**: source, category

### 10. Notification Rules

#### Critical Hardware Alert:
- **Name**: HP Critical Hardware Notification
- **Conditions**:
  ```javascript
  current.severity == 1 && 
  current.u_vendor == 'HP/HPE' &&
  (current.u_component_type == 'CPU' || 
   current.u_component_type == 'Power' ||
   current.u_component_type == 'Temperature')
  ```
- **Recipients**: Hardware-Server-Support group + Management
- **Method**: Email + SMS

#### Storage Alert:
- **Name**: HP Storage Issue Notification  
- **Conditions**:
  ```javascript
  current.severity <= 2 && 
  current.assignment_group.name == 'Storage-Support' &&
  current.u_vendor == 'HP/HPE'
  ```
- **Recipients**: Storage-Support group
- **Method**: Email

### 11. Testing Configuration

#### Test Event Creation:
Create test events for each component type:

**CPU Failure Test:**
```json
{
  "source": "hp-server-01",
  "type": "snmptrap", 
  "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.1001\n1.3.6.1.2.1.1.5.0 = hp-server-01\n1.3.6.1.4.1.232.2.2.4.2.0 = ProLiant DL380 Gen9\n1.3.6.1.4.1.232.2.2.2.2.0 = CZ1234567890\n1.3.6.1.4.1.232.11.2.10.4.0 = 4"
}
```

**Power Supply Test:**
```json
{
  "source": "hp-server-02",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 987654321\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.1011\n1.3.6.1.2.1.1.5.0 = hp-server-02\n1.3.6.1.4.1.232.2.2.4.2.0 = ProLiant DL360 Gen10\n1.3.6.1.4.1.232.6.2.9.3.1.4 = 2"
}
```

### 12. Monitoring and Dashboard

#### Key Metrics Dashboard:
Create performance analytics dashboard with:

**Widgets to Include:**
- Event volume by severity (last 24 hours)
- Top HP systems by event count
- Component failure trends
- Assignment group distribution
- Mean time to resolution by component type

**Filters:**
- u_vendor = 'HP/HPE'
- Date range selectors
- Assignment group filters
- Severity filters

### 13. Maintenance Procedures

#### Weekly Tasks:
- Review unassigned HP events
- Validate assignment group routing accuracy
- Check for new trap OIDs not in mapping table
- Review correlation rule effectiveness

#### Monthly Tasks:
- Analyze event patterns and trends
- Update severity mappings based on business impact
- Review and optimize assignment group distribution
- Update documentation for new hardware models

### 14. Troubleshooting Guide

#### Common Issues:

**Events not processing:**
- Verify HP Enterprise OID (1.3.6.1.4.1.232) in condition
- Check event rule order and conflicts
- Validate JavaScript syntax

**Incorrect assignment:**
- Review component type detection logic
- Verify assignment group names and existence
- Check category mapping accuracy

**Missing field data:**
- Verify MIB file installation on MID Server
- Check varbind parsing regular expressions
- Validate OID mappings for specific hardware models

#### Log Analysis:
- Monitor System Logs > Events for JavaScript errors
- Check Event Management > Processing for transform failures
- Review MID Server logs for SNMP parsing issues

### 15. Security Considerations

#### SNMP Security:
- Implement SNMPv3 where supported (iLO 5)
- Secure community strings for SNMPv2c
- Restrict SNMP access by source IP
- Regular rotation of SNMP credentials

#### ServiceNow Security:
- Role-based access control for event processing
- Audit logging for configuration changes
- Secure storage of sensitive trap data
- Regular security assessments

This configuration provides comprehensive HP/HPE iLO 4/5 SNMP trap handling with intelligent component-based routing and severity mapping.