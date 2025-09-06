# ServiceNow ITOM HP/HPE iLO 4/5 SNMP Trap Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing HP/HPE Integrated Lights-Out (iLO) 4 and iLO 5 SNMP trap handling in ServiceNow ITOM Event Management with intelligent component-based routing and severity mapping.

## Prerequisites
- ServiceNow ITOM Event Management license
- Admin access to ServiceNow instance
- Access to HP/HPE support site for MIB file download
- Network connectivity between HP servers and ServiceNow MID Server
- HP/HPE ProLiant servers with iLO 4 or iLO 5

## Phase 1: MIB File Download and Installation

### Step 1: Download HP/HPE MIB Files

1. **Access HP Enterprise Support Site**:
   - URL: https://support.hpe.com/
   - Login with HP support credentials

2. **Navigate to MIB Downloads**:
   - Go to: Support > Software Downloads
   - Search for: "ProLiant Support Pack" or "HP Systems Insight Manager"
   - Select: Latest version compatible with your servers

3. **Required MIB Files**:
   ```
   Primary HP MIBs:
   - CPQHOST-MIB.txt (HP Host MIB)
   - CPQSINFO-MIB.txt (HP System Information MIB) 
   - CPQHLTH-MIB.txt (HP Health MIB)
   - CPQIDA-MIB.txt (HP Array Controller MIB)
   - CPQNIC-MIB.txt (HP Network Interface MIB)
   - CPQPOWER-MIB.txt (HP Power MIB)
   
   Supporting MIBs:
   - RFC1213-MIB.txt (Standard MIB-II)
   - SNMPv2-MIB.txt (SNMPv2 definitions)
   - SNMPv2-TC.txt (Textual conventions)
   ```

### Step 2: Install MIB Files on MID Server

1. **Copy MIB Files**:
   ```bash
   # On MID Server, create HP MIB directory
   mkdir -p /opt/servicenow/mid/agent/mib/hp
   
   # Copy HP MIB files
   cp CPQHOST-MIB.txt /opt/servicenow/mid/agent/mib/hp/
   cp CPQSINFO-MIB.txt /opt/servicenow/mid/agent/mib/hp/
   cp CPQHLTH-MIB.txt /opt/servicenow/mid/agent/mib/hp/
   cp CPQIDA-MIB.txt /opt/servicenow/mid/agent/mib/hp/
   cp CPQNIC-MIB.txt /opt/servicenow/mid/agent/mib/hp/
   cp CPQPOWER-MIB.txt /opt/servicenow/mid/agent/mib/hp/
   
   # Copy supporting MIBs
   cp RFC1213-MIB.txt /opt/servicenow/mid/agent/mib/
   cp SNMPv2-*.txt /opt/servicenow/mid/agent/mib/
   ```

2. **Configure MID Server MIB Path**:
   - Navigate to: MID Server > Servers
   - Select your MID Server
   - Add parameter: `mid.instance.mib.path=/opt/servicenow/mid/agent/mib`
   - Restart MID Server

3. **Verify MIB Installation**:
   ```bash
   # Test MIB compilation
   snmptranslate -M /opt/servicenow/mid/agent/mib -m ALL 1.3.6.1.4.1.232
   ```

## Phase 2: ServiceNow Configuration

### Step 3: Create Custom Fields

1. **Navigate to System Definition > Tables**
2. **Open Event table (em_event)**
3. **Add the following custom fields**:

   | Field | Type | Label | Max Length | Choice List |
   |-------|------|-------|------------|-------------|
   | u_vendor | String | Vendor | 40 | |
   | u_serial_number | String | Serial Number | 100 | |
   | u_system_id | String | System ID | 100 | |
   | u_system_uptime | String | System Uptime | 100 | |
   | u_component_type | Choice | Component Type | 50 | CPU,Memory,Power,Cooling,Storage,Network,System,Management |
   | u_memory_errors | String | Memory Errors | 50 | |
   | u_snmp_varbinds | String (4000) | SNMP Varbinds | 4000 | |

### Step 4: Create Assignment Groups

1. **Navigate to User Administration > Groups**
2. **Create the following groups** (if they don't exist):

   **Hardware-Server-Support:**
   - Name: `Hardware-Server-Support`
   - Type: `itil`
   - Description: `Server Hardware Support Team`
   - Add team members responsible for server hardware

   **Storage-Support:**
   - Name: `Storage-Support`
   - Type: `itil`
   - Description: `Storage and Array Support Team`
   - Add team members responsible for storage systems

   **Network-Support:**
   - Name: `Network-Support`
   - Type: `itil`  
   - Description: `Network Infrastructure Support Team`
   - Add team members responsible for network issues

   **Server-Management:**
   - Name: `Server-Management`
   - Type: `itil`
   - Description: `Server Management and iLO Support Team`
   - Add team members responsible for iLO and management

### Step 5: Create Event Rule

1. **Navigate to Event Management > Processing > Event Rules**
2. **Create new rule with these settings**:
   - **Name**: `HP iLO 4/5 SNMP Trap Handler`
   - **Table**: `Event [em_event]`
   - **Active**: `true`
   - **Order**: `110`

3. **Condition Script**:
   ```javascript
   // Check if this is an HP SNMP trap
   function evaluateCondition() {
       var hpOID = '1.3.6.1.4.1.232';
       var additionalInfo = current.additional_info.toString();
       return additionalInfo.indexOf(hpOID) >= 0;
   }
   
   evaluateCondition();
   ```

4. **Advanced Script**: Copy the entire content from `servicenow_hp_ilo_trap_handler.js`

### Step 6: Configure SNMP Trap Reception

1. **Navigate to Event Management > Processing > SNMP Trap Receiver**
2. **Configure receiver settings**:
   - **Port**: `162` (standard SNMP trap port)
   - **Community String**: Configure as per your HP servers
   - **MID Server**: Select appropriate MID Server

3. **Create SNMP Credential**:
   - Navigate to: Discovery > Credentials
   - Type: SNMP
   - Community String: (as configured on HP servers)
   - Version: SNMPv2c (or SNMPv3 for iLO 5)

## Phase 3: HP Server Configuration

### Step 7: Configure HP iLO SNMP Settings

#### For iLO 4:

1. **Access iLO Web Interface**:
   - Open browser to iLO IP address
   - Login with administrator credentials

2. **Configure SNMP Settings**:
   - Navigate to: Administration > Management > SNMP Settings
   - **SNMP Agent**: Enable
   - **Community String**: Set read community (match ServiceNow)
   - **Trap Destination**: Add ServiceNow MID Server IP
   - **Trap Community**: Set trap community string

3. **Enable Health Monitoring**:
   - Navigate to: Information > Health
   - Enable all health monitoring options
   - Set appropriate thresholds

#### For iLO 5:

1. **Access iLO Web Interface**:
   - Open browser to iLO IP address  
   - Login with administrator credentials

2. **Configure Enhanced SNMP Settings**:
   - Navigate to: Security > Access Settings > SNMP Settings
   - **SNMP Agent**: Enable
   - **SNMP Version**: SNMPv2c or SNMPv3 (recommended)
   - **Read Community**: Set community string
   - **Trap Destinations**: Add ServiceNow MID Server IP and port 162
   - **Trap Community**: Set trap community string

3. **Configure SNMPv3 (Recommended)**:
   - **User Name**: Create SNMP user
   - **Authentication Protocol**: SHA-256
   - **Privacy Protocol**: AES-256
   - **Authentication Passphrase**: Set secure passphrase
   - **Privacy Passphrase**: Set secure passphrase

### Step 8: Configure Server-Level SNMP

#### Using HP Systems Insight Manager (SIM):

1. **Install HP SIM** on management server
2. **Configure SNMP Settings**:
   ```bash
   # Add trap destination
   snmpconf -a <mid-server-ip> public
   
   # Enable SNMP agent
   snmpconf -e
   
   # Configure community strings
   snmpconf -c public
   ```

#### Using Server CLI (if available):

1. **Access server management CLI**
2. **Configure SNMP**:
   ```bash
   # Enable SNMP
   hponcfg -a -w snmp_enable.xml
   
   # Configure trap destinations  
   hponcfg -a -w snmp_trap.xml
   ```

### Step 9: Test SNMP Connectivity

1. **Test from HP server/iLO**:
   - Navigate to: Administration > Management > SNMP Settings
   - Click "Test SNMP Trap" or "Send Test Trap"
   - Specify MID Server IP as destination

2. **Test with SNMP utilities**:
   ```bash
   # Test SNMP connectivity from MID Server
   snmpwalk -v2c -c <community> <ilo-ip> 1.3.6.1.4.1.232.2.2.4.2.0
   
   # Test trap reception (from server if CLI available)
   snmptrap -v2c -c <community> <mid-server-ip>:162 '' 1.3.6.1.4.1.232.0.1011
   ```

3. **Verify in ServiceNow**:
   - Navigate to: Event Management > Events
   - Look for test events from HP servers
   - Check proper field population and assignment

## Phase 4: Testing and Validation

### Step 10: Create Comprehensive Test Scenarios

#### Hardware Component Tests:

1. **CPU Status Change Simulation**:
   ```json
   {
     "source": "hp-server-01",
     "type": "snmptrap",
     "additional_info": "1.3.6.1.2.1.1.3.0 = 123456789\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.1001\n1.3.6.1.2.1.1.5.0 = hp-server-01\n1.3.6.1.4.1.232.2.2.4.2.0 = ProLiant DL380 Gen9\n1.3.6.1.4.1.232.2.2.2.2.0 = CZ1234567890\n1.3.6.1.4.1.232.11.2.10.4.0 = 4"
   }
   ```

2. **Power Supply Failure Test**:
   ```json
   {
     "source": "hp-server-02", 
     "type": "snmptrap",
     "additional_info": "1.3.6.1.2.1.1.3.0 = 987654321\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.1011\n1.3.6.1.2.1.1.5.0 = hp-server-02\n1.3.6.1.4.1.232.2.2.4.2.0 = ProLiant DL360 Gen10\n1.3.6.1.4.1.232.6.2.9.3.1.4 = 2"
   }
   ```

3. **Temperature Warning Test**:
   ```json
   {
     "source": "hp-server-03",
     "type": "snmptrap", 
     "additional_info": "1.3.6.1.2.1.1.3.0 = 555666777\n1.3.6.1.6.3.1.1.4.1.0 = 1.3.6.1.4.1.232.0.1010\n1.3.6.1.2.1.1.5.0 = hp-server-03\n1.3.6.1.4.1.232.6.2.6.8.1.6 = 3"
   }
   ```

### Step 11: Validation Checklist

**Test Results Validation**:
- [ ] Events are received from HP servers/iLO
- [ ] Trap OID is correctly identified and mapped
- [ ] Component type is properly determined
- [ ] Severity is correctly assigned based on status codes
- [ ] Assignment group routing works correctly:
  - Hardware issues → Hardware-Server-Support
  - Storage issues → Storage-Support  
  - Network issues → Network-Support
  - Management issues → Server-Management
- [ ] Custom fields are populated correctly
- [ ] iLO version is detected accurately
- [ ] Correlation ID is generated for event grouping
- [ ] Impact and urgency are set appropriately

## Phase 5: Monitoring and Maintenance

### Step 12: Set Up Monitoring Dashboard

1. **Create HP Hardware Dashboard**:
   - Navigate to: Performance Analytics > Dashboards
   - Create "HP Server Hardware Events" dashboard

2. **Include Key Widgets**:
   - **Event Volume by Severity**: Last 24/48 hours
   - **Top HP Systems by Event Count**: Identify problematic servers
   - **Component Failure Trends**: Track hardware reliability
   - **Assignment Group Distribution**: Workload distribution
   - **Resolution Time by Component**: Performance metrics
   - **iLO Version Distribution**: Infrastructure overview

3. **Configure Filters**:
   - u_vendor = 'HP/HPE'
   - Date range selectors
   - Assignment group filters
   - Component type filters
   - Severity level filters

### Step 13: Set Up Automated Notifications

#### Critical Hardware Alerts:
```javascript
// Notification Condition
current.severity == 1 && 
current.u_vendor == 'HP/HPE' &&
(current.u_component_type == 'CPU' || 
 current.u_component_type == 'Power' ||
 current.u_component_type == 'Temperature')
```

#### Storage Alerts:
```javascript
// Storage Alert Condition
current.severity <= 2 && 
current.assignment_group.name == 'Storage-Support' &&
current.u_vendor == 'HP/HPE'
```

### Step 14: Regular Maintenance Procedures

#### Daily Tasks:
- Monitor critical events dashboard
- Review unassigned HP events
- Check for new unknown trap OIDs

#### Weekly Tasks:
- Analyze event trends and patterns
- Review assignment group accuracy
- Validate new server integrations
- Check MID Server SNMP processing logs

#### Monthly Tasks:
- Review and update severity mappings
- Analyze component failure patterns
- Update documentation for new hardware models
- Performance optimization review
- Security assessment of SNMP configurations

## Phase 6: Troubleshooting Guide

### Common Issues and Solutions

#### Events Not Appearing:
1. **Check MID Server connectivity**:
   ```bash
   # Test network connectivity
   telnet <ilo-ip> 161
   
   # Check SNMP response
   snmpget -v2c -c <community> <ilo-ip> 1.3.6.1.2.1.1.1.0
   ```

2. **Verify iLO SNMP configuration**:
   - Confirm SNMP agent is enabled
   - Check trap destination configuration
   - Verify community strings match

3. **Review firewall rules**:
   - Ensure port 162 (SNMP trap) is open
   - Check both server and MID Server firewalls

#### Incorrect Event Processing:
1. **Validate JavaScript syntax**:
   - Use ServiceNow script debugger
   - Check for syntax errors in event rule

2. **Review MIB file installation**:
   - Verify all required MIB files are present
   - Check MIB compilation errors

3. **Check varbind parsing**:
   - Review additional_info field format
   - Validate regular expression patterns

#### Assignment Group Issues:
1. **Verify group existence and type**:
   - Ensure all assignment groups exist
   - Confirm group type is 'itil'

2. **Check component type detection**:
   - Review component mapping logic
   - Validate trap OID to component mapping

### Performance Optimization

#### High Volume Environments:
1. **Event Filtering**:
   - Implement pre-filtering for informational events
   - Set up event suppression for known issues

2. **Batch Processing**:
   - Configure batch processing for non-critical events
   - Implement event correlation to reduce noise

3. **Database Optimization**:
   - Create indexes on frequently queried fields
   - Implement appropriate retention policies

## Security Best Practices

### SNMP Security:
1. **Use SNMPv3 where possible** (iLO 5 support)
2. **Secure community strings** for SNMPv2c
3. **Implement access control lists** on network devices
4. **Regular credential rotation**
5. **Network segmentation** for management traffic

### ServiceNow Security:
1. **Role-based access control** for event processing
2. **Audit logging** for configuration changes
3. **Secure storage** of sensitive trap data
4. **Regular security assessments**

## Integration with Other Tools

### HP Systems Insight Manager (SIM):
- Configure SIM for centralized SNMP management
- Forward critical events to ServiceNow
- Maintain historical trending data

### HP OneView:
- Integrate with HP OneView for comprehensive monitoring
- Use API integration for additional context
- Correlate events with configuration changes

## Additional Resources

- **HP Enterprise Documentation**: support.hpe.com
- **ServiceNow Community**: community.servicenow.com
- **SNMP RFCs**: RFC 1157, RFC 3416, RFC 3584
- **HP MIB Reference**: Available in ProLiant Support Pack

## Support Contacts

- **HP Enterprise Support**: support.hpe.com
- **ServiceNow Support**: support.servicenow.com
- **Internal Teams**: 
  - Hardware-Server-Support
  - Storage-Support
  - Network-Support
  - Server-Management

This comprehensive guide ensures successful implementation of HP/HPE iLO 4/5 SNMP trap handling with intelligent routing and component-based severity mapping.