# ServiceNow ITOM Event Field Mapping Configuration for NetApp CDOT 9.14

## Event Field Mapping Setup Instructions

### 1. Create New Event Rule

Navigate to: **Event Management > Processing > Event Rules**

#### Basic Configuration:
- **Name**: NetApp CDOT 9.14 SNMP Trap Handler
- **Table**: Event [em_event]
- **Active**: True
- **Order**: 100 (adjust based on your environment)

#### Conditions:
```javascript
// Condition Script
var netappOID = '1.3.6.1.4.1.789';
var trapOID = current.additional_info.toString();
trapOID.indexOf(netappOID) >= 0
```

### 2. Field Mapping Configuration

#### Transform Map Settings:
- **Source Table**: Event [em_event]
- **Target Table**: Incident [incident] or Alert [em_alert]
- **Active**: True

#### Field Mappings:

| Target Field | Source/Script | Type |
|--------------|---------------|------|
| source | Script | Advanced |
| node | Script | Advanced |
| type | "NetApp Storage Alert" | Fixed |
| severity | Script | Advanced |
| description | Script | Advanced |
| short_description | Script | Advanced |
| assignment_group | "Storage-FTS" | Fixed |
| category | Script | Advanced |
| subcategory | "NetApp CDOT 9.14" | Fixed |
| priority | Script | Advanced |
| impact | Script | Advanced |
| urgency | Script | Advanced |

### 3. Custom Fields Configuration

Add the following custom fields to the target table:

| Field Name | Type | Label | Max Length |
|------------|------|-------|------------|
| u_vendor | String | Vendor | 40 |
| u_serial_number | String | Serial Number | 100 |
| u_ontap_version | String | ONTAP Version | 100 |
| u_system_uptime | String | System Uptime | 100 |
| u_snmp_varbinds | String (Large) | SNMP Varbinds | 4000 |
| u_affected_volume | String | Affected Volume | 200 |
| u_current_file_count | String | Current File Count | 20 |
| u_maxdir_limit | String | Maxdir Limit | 20 |
| u_usage_percentage | String | Usage Percentage | 10 |
| u_threshold_status | String | Threshold Status | 100 |

### 4. Event Rule Actions

#### Action Type: Transform Event
- **Transform Map**: NetApp CDOT SNMP Transform
- **Advanced Script**: Use the provided JavaScript from servicenow_netapp_trap_handler.js

### 5. Assignment Group Configuration

Ensure the "Storage-FTS" assignment group exists:
- Navigate to: **User Administration > Groups**
- Create group if it doesn't exist:
  - **Name**: Storage-FTS
  - **Type**: itil
  - **Description**: Storage File and Technology Services Support Team

### 6. Correlation Rules (Optional)

Create correlation rules to group related events:

#### Correlation Rule Configuration:
- **Name**: NetApp Storage Correlation
- **Table**: Event [em_event]
- **Conditions**: 
  ```javascript
  current.source.toString().indexOf('NetApp') >= 0 || 
  current.type.toString().indexOf('NetApp') >= 0
  ```
- **Correlation Fields**: source, node, category

### 7. Notification Rules

Set up notifications for critical NetApp events:

#### Email Notification Rule:
- **Name**: NetApp Critical Alert Notification
- **Conditions**: 
  ```javascript
  current.severity == 1 && 
  current.assignment_group.name == 'Storage-FTS'
  ```
- **Recipients**: Storage-FTS group members
- **Template**: Include source, description, and correlation_id

### 8. Testing Configuration

#### Test Event Simulation:
Create test events to validate the configuration:

**General NetApp Event:**
```json
{
  "source": "netapp-cluster-01",
  "node": "netapp-cluster-01",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.789.0.15\n1.3.6.1.2.1.1.5.0 = netapp-cluster-01\n1.3.6.1.4.1.789.1.1.9.0 = 1234567890\n1.3.6.1.4.1.789.1.1.5.0 = FAS8040\n1.3.6.1.4.1.789.1.1.2.0 = NetApp Release 9.14.0\n1.3.6.1.4.1.789.1.2.2.0 = Disk /aggr0/plex0/rg0/d0 failed"
}
```

**Maxdir Size Event (Warning):**
```json
{
  "source": "netapp-cluster-02",
  "node": "netapp-cluster-02",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 987654321\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.789.0.485\n1.3.6.1.2.1.1.5.0 = netapp-cluster-02\n1.3.6.1.4.1.789.1.1.9.0 = 0987654321\n1.3.6.1.4.1.789.1.2.2.0 = Volume /vol/data01 directory size warning: files approaching limit"
}
```

**WAFL Directory Full Event:**
```json
{
  "source": "netapp-cluster-03",
  "node": "netapp-cluster-03",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 555666777\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.789.0.187\n1.3.6.1.2.1.1.5.0 = netapp-cluster-03\n1.3.6.1.4.1.789.1.1.9.0 = 1122334455\n1.3.6.1.4.1.789.1.2.2.0 = WAFL directory structure is full"
}
```

**Maxdir Size Alert (Critical):**
```json
{
  "source": "netapp-cluster-04",
  "node": "netapp-cluster-04",
  "type": "snmptrap",
  "additional_info": "1.3.6.1.2.1.1.3.0 = 777888999\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.789.0.482\n1.3.6.1.2.1.1.5.0 = netapp-cluster-04\n1.3.6.1.4.1.789.1.1.9.0 = 2233445566\n1.3.6.1.4.1.789.1.2.2.0 = Volume /vol/database directory critical size limit reached"
}
```

### 9. Monitoring and Troubleshooting

#### Log Monitoring:
Monitor the following logs for issues:
- **System Logs > Events**: Check for processing errors
- **Event Management > Events**: Verify event processing
- **Event Management > Processing > Event Processing**: Monitor transform execution

#### Common Issues and Solutions:

1. **Events not being processed**:
   - Check event rule conditions
   - Verify OID matching logic
   - Ensure event rule is active and ordered correctly

2. **Incorrect field mapping**:
   - Validate JavaScript syntax in transform script
   - Check field permissions and data types
   - Verify custom field configurations

3. **Assignment group not found**:
   - Ensure Storage-FTS group exists
   - Check group type and permissions
   - Verify group membership

### 10. Performance Considerations

- **Indexing**: Create indexes on frequently queried fields (source, node, correlation_id)
- **Retention**: Set appropriate retention policies for events and alerts
- **Batch Processing**: Consider batch processing for high-volume environments

### 11. Security Considerations

- **SNMP Security**: Ensure SNMP community strings are properly secured
- **Access Control**: Limit access to event processing configuration
- **Audit Trail**: Enable audit logging for configuration changes