# ServiceNow ITOM NetApp CDOT 9.14 SNMP Trap Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing NetApp Clustered Data ONTAP 9.14 SNMP trap handling in ServiceNow ITOM Event Management with advanced field mapping.

## Prerequisites
- ServiceNow ITOM Event Management license
- Admin access to ServiceNow instance
- Access to NetApp support site for MIB file download
- Network connectivity between NetApp systems and ServiceNow MID Server

## Phase 1: MIB File Download and Installation

### Step 1: Download NetApp CDOT 9.14 MIB Files

1. **Access NetApp Support Site**:
   - URL: https://mysupport.netapp.com/
   - Login with your NetApp support credentials

2. **Navigate to MIB Downloads**:
   - Go to: Support > Downloads > Software
   - Select: System Manager/ONTAP
   - Choose: ONTAP 9.14.x
   - Download: Management Software package

3. **Required MIB Files**:
   ```
   Primary MIBs:
   - NETAPP-MIB.txt (Main NetApp enterprise MIB)
   - NETAPP-TRAPS-MIB.txt (NetApp trap definitions)
   
   Supporting MIBs:
   - RFC1213-MIB.txt (Standard MIB-II)
   - SNMPv2-MIB.txt (SNMPv2 definitions)
   - SNMPv2-TC.txt (Textual conventions)
   ```

### Step 2: Install MIB Files on MID Server

1. **Copy MIB Files**:
   ```bash
   # On MID Server, create MIB directory if it doesn't exist
   mkdir -p /opt/servicenow/mid/agent/mib
   
   # Copy MIB files to MID server
   cp NETAPP-*.txt /opt/servicenow/mid/agent/mib/
   cp RFC1213-MIB.txt /opt/servicenow/mid/agent/mib/
   cp SNMPv2-*.txt /opt/servicenow/mid/agent/mib/
   ```

2. **Configure MID Server MIB Path**:
   - Navigate to: MID Server > Servers
   - Select your MID Server
   - Add parameter: `mid.instance.mib.path=/opt/servicenow/mid/agent/mib`
   - Restart MID Server

## Phase 2: ServiceNow Configuration

### Step 3: Create Custom Fields

1. **Navigate to System Definition > Tables**
2. **Open Event table (em_event)**
3. **Add the following custom fields**:

   | Field | Type | Label | Max Length |
   |-------|------|-------|------------|
   | u_vendor | String | Vendor | 40 |
   | u_serial_number | String | Serial Number | 100 |
   | u_ontap_version | String | ONTAP Version | 100 |
   | u_system_uptime | String | System Uptime | 100 |
   | u_snmp_varbinds | String (4000) | SNMP Varbinds | 4000 |

### Step 4: Create Assignment Group

1. **Navigate to User Administration > Groups**
2. **Create new group**:
   - Name: `Storage-FTS`
   - Type: `itil`
   - Description: `Storage File and Technology Services Support Team`
3. **Add appropriate team members**

### Step 5: Create Event Rule

1. **Navigate to Event Management > Processing > Event Rules**
2. **Create new rule with these settings**:
   - **Name**: `NetApp CDOT 9.14 SNMP Trap Handler`
   - **Table**: `Event [em_event]`
   - **Active**: `true`
   - **Order**: `100`

3. **Condition Script**:
   ```javascript
   // Check if this is a NetApp SNMP trap
   function evaluateCondition() {
       var netappOID = '1.3.6.1.4.1.789';
       var additionalInfo = current.additional_info.toString();
       return additionalInfo.indexOf(netappOID) >= 0;
   }
   
   evaluateCondition();
   ```

4. **Advanced Script**: Copy the entire content from `servicenow_netapp_trap_handler.js`

### Step 6: Configure SNMP Trap Reception

1. **Navigate to Event Management > Processing > SNMP Trap Receiver**
2. **Configure receiver settings**:
   - **Port**: `162` (standard SNMP trap port)
   - **Community String**: Configure as per your NetApp systems
   - **MID Server**: Select appropriate MID Server

3. **Create SNMP Credential**:
   - Navigate to: Discovery > Credentials
   - Type: SNMP
   - Community String: (as configured on NetApp systems)

## Phase 3: NetApp System Configuration

### Step 7: Configure NetApp SNMP Settings

1. **Access NetApp System Manager or CLI**

2. **Configure SNMP (CLI method)**:
   ```bash
   # Enable SNMP on the cluster
   cluster::> snmp init 1
   
   # Set community string
   cluster::> snmp community add -type ro -community <your-community-string>
   
   # Configure trap host (ServiceNow MID Server)
   cluster::> snmp traphost add <mid-server-ip> <community-string>
   
   # Enable traps for specific events
   cluster::> event config modify -messagename * -snmp-support true
   ```

3. **Configure SNMP (System Manager method)**:
   - Navigate to: Cluster > Settings > SNMP
   - Enable SNMP
   - Add trap hosts (MID Server IP addresses)
   - Configure community strings

### Step 8: Test SNMP Connectivity

1. **Test from NetApp system**:
   ```bash
   # Test SNMP connectivity
   cluster::> snmp test -host <mid-server-ip> -community <community-string>
   
   # Generate test trap
   cluster::> snmp traptest -community <community-string> -host <mid-server-ip>
   ```

2. **Verify in ServiceNow**:
   - Navigate to: Event Management > Events
   - Look for test events from NetApp systems

## Phase 4: Testing and Validation

### Step 9: Create Test Scenarios

1. **Simulate Hardware Failure**:
   ```bash
   # On NetApp system (if safe in test environment)
   cluster::> system health alert simulate -node <node-name> -alert-id DualPathToDiskShelf_Alert
   ```

2. **Monitor ServiceNow Events**:
   - Check Event Management > Events
   - Verify proper field mapping
   - Confirm assignment to Storage-FTS group

### Step 10: Validate Event Processing

**Test Checklist**:
- [ ] Events are received from NetApp systems
- [ ] Trap OID is correctly identified
- [ ] Severity is properly mapped
- [ ] Description includes trap OID and details
- [ ] Assignment group is set to Storage-FTS
- [ ] Custom fields are populated correctly
- [ ] Correlation ID is generated

## Phase 5: Monitoring and Maintenance

### Step 11: Set Up Monitoring

1. **Create Dashboard**:
   - Navigate to: Performance Analytics > Dashboards
   - Create NetApp Storage Events dashboard
   - Include widgets for:
     - Event volume by severity
     - Top NetApp systems by event count
     - Event resolution times

2. **Configure Alerts**:
   - Set up email notifications for critical NetApp events
   - Configure escalation rules for unassigned events

### Step 12: Regular Maintenance Tasks

1. **Weekly Tasks**:
   - Review event processing logs
   - Check for any failed event transformations
   - Validate assignment group membership

2. **Monthly Tasks**:
   - Review and update severity mappings
   - Analyze event patterns and trends
   - Update documentation as needed

## Troubleshooting Guide

### Common Issues and Solutions

1. **Events not appearing in ServiceNow**:
   - Check MID Server connectivity
   - Verify SNMP configuration on NetApp
   - Review firewall rules (port 162)

2. **Incorrect event parsing**:
   - Validate JavaScript syntax in event rule
   - Check MIB file installation
   - Review additional_info field format

3. **Assignment group issues**:
   - Verify group exists and is active
   - Check group type is 'itil'
   - Ensure group has proper permissions

### Log Locations

- **MID Server Logs**: `/opt/servicenow/mid/agent/logs/`
- **ServiceNow System Logs**: System Logs > Events
- **Event Processing Logs**: Event Management > Processing

## Security Best Practices

1. **SNMP Security**:
   - Use SNMPv3 where possible
   - Secure community strings
   - Limit SNMP access by source IP

2. **ServiceNow Security**:
   - Implement role-based access control
   - Regular security updates
   - Audit configuration changes

## Performance Optimization

1. **Event Volume Management**:
   - Implement event filtering for noise reduction
   - Set up event correlation to reduce duplicates
   - Configure appropriate retention policies

2. **Processing Optimization**:
   - Monitor event rule execution times
   - Optimize JavaScript code for performance
   - Consider batch processing for high volumes

## Additional Resources

- **NetApp Documentation**: docs.netapp.com
- **ServiceNow Community**: community.servicenow.com
- **SNMP RFC Documents**: RFC 1157, RFC 3416
- **NetApp MIB Reference**: Available in downloaded MIB package

## Support Contacts

- **NetApp Support**: support.netapp.com
- **ServiceNow Support**: support.servicenow.com
- **Internal Storage Team**: Storage-FTS assignment group