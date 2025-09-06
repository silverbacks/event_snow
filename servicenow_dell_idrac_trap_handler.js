// ServiceNow ITOM Event Field Mapping - Advanced Script for Dell iDRAC SNMP Traps
// This script intercepts SNMP traps from Dell iDRAC systems and creates properly formatted alerts

(function() {
    
    // Dell Enterprise OID prefixes
    var DELL_ENTERPRISE_OID = '1.3.6.1.4.1.674';
    var DELL_SERVER_OID = '1.3.6.1.4.1.674.10892.1'; // Dell OpenManage Server Administrator
    var DELL_IDRAC_OID = '1.3.6.1.4.1.674.10892.5'; // Dell iDRAC specific
    var DELL_OME_OID = '1.3.6.1.4.1.674.11000.1000.100'; // Dell OM Essentials
    
    // Trap OID to severity and category mapping - Dell trap OIDs from actual MIB files
    var trapInfoMap = {
        // OM Essentials (OME) traps - from MIB-Dell-OME.mib
        '1.3.6.1.4.1.674.11000.1000.100.1.1': { severity: 5, name: 'OME Test Alert', category: 'Management', component: 'Test' },
        '1.3.6.1.4.1.674.11000.1000.100.1.1000': { severity: 5, name: 'OME System Up', category: 'System', component: 'Status' },
        '1.3.6.1.4.1.674.11000.1000.100.1.1001': { severity: 1, name: 'OME System Down', category: 'System', component: 'Status' },
        '1.3.6.1.4.1.674.11000.1000.100.1.2000': { severity: 3, name: 'OME Forwarded Alert', category: 'Management', component: 'Alert' },
        '1.3.6.1.4.1.674.11000.1000.100.1.3001': { severity: 3, name: 'OME Unknown Status', category: 'System', component: 'Status' },
        '1.3.6.1.4.1.674.11000.1000.100.1.3002': { severity: 5, name: 'OME Normal Status', category: 'System', component: 'Status' },
        '1.3.6.1.4.1.674.11000.1000.100.1.3003': { severity: 4, name: 'OME Warning Status', category: 'System', component: 'Status' },
        '1.3.6.1.4.1.674.11000.1000.100.1.3004': { severity: 1, name: 'OME Critical Status', category: 'System', component: 'Status' },
        
        // Legacy OpenManage Server Administrator traps (may still be used)
        '1.3.6.1.4.1.674.10892.1.0.1001': { severity: 1, name: 'Server Power Off', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.674.10892.1.0.1004': { severity: 1, name: 'System Board Failure', category: 'Hardware', component: 'System' },
        '1.3.6.1.4.1.674.10892.1.0.1052': { severity: 1, name: 'Temperature Critical', category: 'Hardware', component: 'Temperature' },
        '1.3.6.1.4.1.674.10892.1.0.1106': { severity: 1, name: 'Power Supply Critical Failure', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.674.10892.1.0.1153': { severity: 1, name: 'CPU Critical Error', category: 'Hardware', component: 'CPU' },
        '1.3.6.1.4.1.674.10892.1.0.1202': { severity: 1, name: 'Memory Critical Error', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.674.10892.1.0.1304': { severity: 1, name: 'Storage Controller Failure', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.674.10892.1.0.1403': { severity: 1, name: 'Physical Disk Failure', category: 'Storage', component: 'Drive' },
        
        // Major severity traps
        '1.3.6.1.4.1.674.10892.1.0.1002': { severity: 2, name: 'Server Power On', category: 'System', component: 'Power' },
        '1.3.6.1.4.1.674.10892.1.0.1003': { severity: 2, name: 'Server Reset', category: 'System', component: 'System' },
        '1.3.6.1.4.1.674.10892.1.0.1051': { severity: 2, name: 'Temperature Warning', category: 'Hardware', component: 'Temperature' },
        '1.3.6.1.4.1.674.10892.1.0.1105': { severity: 2, name: 'Power Supply Failure', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.674.10892.1.0.1107': { severity: 2, name: 'Power Redundancy Lost', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.674.10892.1.0.1151': { severity: 2, name: 'CPU Status Change', category: 'Hardware', component: 'CPU' },
        '1.3.6.1.4.1.674.10892.1.0.1152': { severity: 2, name: 'CPU Throttling', category: 'Hardware', component: 'CPU' },
        '1.3.6.1.4.1.674.10892.1.0.1201': { severity: 2, name: 'Memory Error Corrected', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.674.10892.1.0.1203': { severity: 2, name: 'Memory Device Status Change', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.674.10892.1.0.1251': { severity: 2, name: 'Fan Failure', category: 'Hardware', component: 'Cooling' },
        '1.3.6.1.4.1.674.10892.1.0.1252': { severity: 2, name: 'Fan Speed Change', category: 'Hardware', component: 'Cooling' },
        '1.3.6.1.4.1.674.10892.1.0.1301': { severity: 2, name: 'Storage Controller Status Change', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.674.10892.1.0.1302': { severity: 2, name: 'Virtual Disk Status Change', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.674.10892.1.0.1401': { severity: 2, name: 'Physical Disk Status Change', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.674.10892.1.0.1402': { severity: 2, name: 'Physical Disk Rebuild', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.674.10892.1.0.1451': { severity: 2, name: 'Network Interface Down', category: 'Network', component: 'NIC' },
        
        // iDRAC Management traps
        '1.3.6.1.4.1.674.10892.5.0.2001': { severity: 2, name: 'iDRAC Service Tag Changed', category: 'Management', component: 'iDRAC' },
        '1.3.6.1.4.1.674.10892.5.0.2002': { severity: 3, name: 'iDRAC Configuration Changed', category: 'Management', component: 'iDRAC' },
        '1.3.6.1.4.1.674.10892.5.0.2003': { severity: 2, name: 'iDRAC User Authentication Failed', category: 'Security', component: 'Authentication' },
        '1.3.6.1.4.1.674.10892.5.0.2004': { severity: 3, name: 'iDRAC User Login', category: 'Security', component: 'Authentication' },
        '1.3.6.1.4.1.674.10892.5.0.2005': { severity: 3, name: 'iDRAC User Logout', category: 'Security', component: 'Authentication' },
        '1.3.6.1.4.1.674.10892.5.0.2006': { severity: 2, name: 'iDRAC Firmware Update', category: 'Management', component: 'Firmware' },
        '1.3.6.1.4.1.674.10892.5.0.2007': { severity: 1, name: 'iDRAC Communication Lost', category: 'Management', component: 'iDRAC' },
        
        // Minor severity traps
        '1.3.6.1.4.1.674.10892.1.0.1053': { severity: 3, name: 'Temperature Normal', category: 'Hardware', component: 'Temperature' },
        '1.3.6.1.4.1.674.10892.1.0.1108': { severity: 3, name: 'Power Supply Normal', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.674.10892.1.0.1154': { severity: 3, name: 'CPU Normal', category: 'Hardware', component: 'CPU' },
        '1.3.6.1.4.1.674.10892.1.0.1204': { severity: 3, name: 'Memory Normal', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.674.10892.1.0.1253': { severity: 3, name: 'Fan Normal', category: 'Hardware', component: 'Cooling' },
        '1.3.6.1.4.1.674.10892.1.0.1303': { severity: 3, name: 'Storage Normal', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.674.10892.1.0.1404': { severity: 3, name: 'Physical Disk Normal', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.674.10892.1.0.1452': { severity: 3, name: 'Network Interface Up', category: 'Network', component: 'NIC' },
        
        // Warning severity traps
        '1.3.6.1.4.1.674.10892.1.0.1501': { severity: 4, name: 'System Performance Degraded', category: 'System', component: 'Performance' },
        '1.3.6.1.4.1.674.10892.1.0.1502': { severity: 4, name: 'Intrusion Detection', category: 'Security', component: 'Physical' },
        '1.3.6.1.4.1.674.10892.1.0.1503': { severity: 4, name: 'System Event Log Full', category: 'System', component: 'Logging' },
        
        // Info severity traps
        '1.3.6.1.4.1.674.10892.1.0.1601': { severity: 5, name: 'System Boot Complete', category: 'System', component: 'Boot' },
        '1.3.6.1.4.1.674.10892.1.0.1602': { severity: 5, name: 'System Inventory Update', category: 'System', component: 'Inventory' }
    };
    
    // Standard SNMP OIDs for varbind parsing
    var standardOIDs = {
        sysUpTime: '1.3.6.1.2.1.1.3.0',
        snmpTrapOID: '1.3.6.1.6.3.1.1.4.1.0',
        sysName: '1.3.6.1.2.1.1.5.0',
        sysDescr: '1.3.6.1.2.1.1.1.0'
    };
    
    // Dell-specific OIDs from actual MIB files
    var dellOIDs = {
        // OME (OM Essentials) OIDs - from MIB-Dell-OME.mib
        omeAlertMessage: '1.3.6.1.4.1.674.11000.1000.100.1.1',
        omeAlertDevice: '1.3.6.1.4.1.674.11000.1000.100.1.2',
        omeAlertSeverity: '1.3.6.1.4.1.674.11000.1000.100.1.3',
        
        // Alert Variables OIDs - from MIB-Dell-10892.mib  
        alertSystem: '1.3.6.1.4.1.674.10892.1.5000.10.1',
        alertTableIndexOID: '1.3.6.1.4.1.674.10892.1.5000.10.2', 
        alertMessage: '1.3.6.1.4.1.674.10892.1.5000.10.3',
        alertCurrentStatus: '1.3.6.1.4.1.674.10892.1.5000.10.4',
        // Server Administrator OIDs
        systemStatus: '1.3.6.1.4.1.674.10892.1.200.10.1.2.1',
        systemServiceTag: '1.3.6.1.4.1.674.10892.1.300.10.1.11.1',
        systemExpressServiceCode: '1.3.6.1.4.1.674.10892.1.300.10.1.12.1',
        systemModelName: '1.3.6.1.4.1.674.10892.1.300.10.1.9.1',
        systemBIOSVersion: '1.3.6.1.4.1.674.10892.1.300.10.1.5.1',
        
        // Hardware status OIDs
        temperatureStatus: '1.3.6.1.4.1.674.10892.1.700.20.1.5.1',
        temperatureReading: '1.3.6.1.4.1.674.10892.1.700.20.1.6.1',
        fanStatus: '1.3.6.1.4.1.674.10892.1.700.12.1.5.1',
        fanSpeed: '1.3.6.1.4.1.674.10892.1.700.12.1.6.1',
        powerSupplyStatus: '1.3.6.1.4.1.674.10892.1.600.12.1.5.1',
        powerSupplyType: '1.3.6.1.4.1.674.10892.1.600.12.1.7.1',
        
        // Memory OIDs
        memoryDeviceStatus: '1.3.6.1.4.1.674.10892.1.1100.50.1.5.1',
        memoryDeviceSize: '1.3.6.1.4.1.674.10892.1.1100.50.1.14.1',
        memoryDeviceType: '1.3.6.1.4.1.674.10892.1.1100.50.1.7.1',
        
        // Storage OIDs
        virtualDiskStatus: '1.3.6.1.4.1.674.10892.1.1400.10.1.4.1',
        physicalDiskStatus: '1.3.6.1.4.1.674.10892.1.1400.20.1.4.1',
        controllerStatus: '1.3.6.1.4.1.674.10892.1.1400.10.1.4.1',
        
        // Network OIDs
        networkDeviceStatus: '1.3.6.1.4.1.674.10892.1.1200.10.1.3.1',
        
        // iDRAC specific OIDs
        idracVersion: '1.3.6.1.4.1.674.10892.5.1.1.6.0',
        idracURL: '1.3.6.1.4.1.674.10892.5.1.1.5.0'
    };
    
    // Status code mappings
    var statusMappings = {
        general: {
            1: { text: 'Other', severity: 3 },
            2: { text: 'Unknown', severity: 3 },
            3: { text: 'OK', severity: 5 },
            4: { text: 'Non-Critical', severity: 4 },
            5: { text: 'Critical', severity: 1 },
            6: { text: 'Non-Recoverable', severity: 1 }
        },
        powerSupply: {
            1: { text: 'Other', severity: 3 },
            2: { text: 'Unknown', severity: 3 },
            3: { text: 'OK', severity: 5 },
            4: { text: 'Non-Critical', severity: 4 },
            5: { text: 'Critical', severity: 1 },
            6: { text: 'Non-Recoverable', severity: 1 },
            7: { text: 'AC Lost', severity: 2 },
            8: { text: 'AC Lost or Out of Range', severity: 2 },
            9: { text: 'AC Out of Range but Present', severity: 4 },
            10: { text: 'Configuration Error', severity: 2 }
        },
        temperature: {
            1: { text: 'Other', severity: 3 },
            2: { text: 'Unknown', severity: 3 },
            3: { text: 'OK', severity: 5 },
            4: { text: 'Non-Critical Upper', severity: 4 },
            5: { text: 'Critical Upper', severity: 1 },
            6: { text: 'Non-Recoverable Upper', severity: 1 },
            7: { text: 'Non-Critical Lower', severity: 4 },
            8: { text: 'Critical Lower', severity: 1 },
            9: { text: 'Non-Recoverable Lower', severity: 1 },
            10: { text: 'Failed', severity: 2 }
        }
    };
    
    /**
     * Main function to process Dell iDRAC SNMP trap
     */
    function processDellTrap() {
        try {
            // Check if this is a Dell trap
            if (!isDellTrap()) {
                return;
            }
            
            // Parse trap OID and get trap information
            var trapOID = getTrapOID();
            var trapInfo = getTrapInfo(trapOID);
            
            // Get cleaned hostname
            var sourceNode = getSourceNode();
            
            // Set basic event fields
            event.source = sourceNode;
            event.node = sourceNode;
            event.type = 'Dell iDRAC Hardware Alert';
            event.resource = getResource();
            
            // Set severity and description based on component status
            setSeverityAndDescription(trapInfo, trapOID);
            
            // Set assignment group based on component type
            setAssignmentGroup(trapInfo);
            
            // Set additional fields
            setAdditionalFields(trapInfo);
            
            // Parse and add custom fields from varbinds
            parseVarbinds();
            
            // Set correlation information
            setCorrelationInfo(trapInfo);
            
        } catch (error) {
            gs.log('Error processing Dell iDRAC SNMP trap: ' + error.toString(), 'Dell iDRAC Trap Handler');
        }
    }
    
    /**
     * Check if this is a Dell SNMP trap
     */
    function isDellTrap() {
        var trapOID = getTrapOID();
        return trapOID && (trapOID.indexOf(DELL_ENTERPRISE_OID) === 0 || 
                          trapOID.indexOf(DELL_OME_OID) === 0);
    }
    
    /**
     * Get the trap OID from varbinds
     */
    function getTrapOID() {
        var varbinds = event.additional_info || '';
        var trapOIDMatch = varbinds.match(new RegExp(standardOIDs.snmpTrapOID + '\\s*=\\s*([\\d\\.]+)'));
        return trapOIDMatch ? trapOIDMatch[1] : null;
    }
    
    /**
     * Get trap information from mapping table
     */
    function getTrapInfo(trapOID) {
        return trapInfoMap[trapOID] || {
            severity: 3,
            name: 'Unknown Dell Hardware Trap',
            category: 'Hardware',
            component: 'Unknown'
        };
    }
    
    /**
     * Get source node from varbinds with intelligent hostname extraction
     */
    function getSourceNode() {
        var varbinds = event.additional_info || '';
        var hostname = null;
        
        // Try to get hostname from sysName first (most reliable)
        var sysNameMatch = varbinds.match(new RegExp(standardOIDs.sysName + '\\s*=\\s*([^\\r\\n]+)'));
        if (sysNameMatch) {
            hostname = sysNameMatch[1].trim();
        }
        
        // If no sysName, try Dell-specific model name
        if (!hostname) {
            var modelMatch = varbinds.match(new RegExp(dellOIDs.systemModelName + '\\s*=\\s*([^\\r\\n]+)'));
            if (modelMatch) {
                hostname = modelMatch[1].trim();
            }
        }
        
        // If no hostname, try service tag
        if (!hostname) {
            var serviceTagMatch = varbinds.match(new RegExp(dellOIDs.systemServiceTag + '\\s*=\\s*([^\\r\\n]+)'));
            if (serviceTagMatch) {
                hostname = serviceTagMatch[1].trim();
            }
        }
        
        // Fallback to event source if available
        if (!hostname && event.source) {
            hostname = event.source.toString();
        }
        
        // Clean up hostname - remove iDRAC suffixes and common patterns
        if (hostname) {
            hostname = cleanHostname(hostname);
        }
        
        return hostname || 'Unknown Dell Server';
    }
    
    /**
     * Clean hostname by removing iDRAC suffixes and common naming patterns
     */
    function cleanHostname(hostname) {
        if (!hostname) return hostname;
        
        var cleanedName = hostname.toString().trim();
        
        // Remove common iDRAC suffixes (case insensitive)
        var suffixPatterns = [
            /-idrac$/i,         // hostname-idrac
            /-drac$/i,          // hostname-drac
            /-ipmi$/i,          // hostname-ipmi
            /-mgmt$/i,          // hostname-mgmt
            /-bmc$/i,           // hostname-bmc
            /-oob$/i,           // hostname-oob (out of band)
            /-mgt$/i,           // hostname-mgt (management)
            /-ilo$/i,           // hostname-ilo (HP style but sometimes used)
            /-con$/i,           // hostname-con
            /r$/i,              // hostnamer (single 'r' suffix)
            /-r$/i              // hostname-r
        ];
        
        // Apply suffix removal patterns
        for (var i = 0; i < suffixPatterns.length; i++) {
            if (suffixPatterns[i].test(cleanedName)) {
                cleanedName = cleanedName.replace(suffixPatterns[i], '');
                break; // Only remove one suffix to avoid over-cleaning
            }
        }
        
        // Remove any trailing hyphens or periods
        cleanedName = cleanedName.replace(/[-\\.]+$/, '');
        
        // Ensure we don't return an empty string
        if (cleanedName.length === 0) {
            return hostname; // Return original if cleaning results in empty string
        }
        
        return cleanedName;
    }
    
    /**
     * Get resource information
     */
    function getResource() {
        var varbinds = event.additional_info || '';
        var modelMatch = varbinds.match(new RegExp(dellOIDs.systemModelName + '\\s*=\\s*([^\\r\\n]+)'));
        return modelMatch ? modelMatch[1].trim() : 'Dell Server';
    }
    
    /**
     * Set severity and description with component status analysis
     */
    function setSeverityAndDescription(trapInfo, trapOID) {
        var varbinds = event.additional_info || '';
        var finalSeverity = trapInfo.severity;
        var statusText = '';
        
        // Check for component-specific status codes
        var componentStatus = getComponentStatus(trapInfo.component, varbinds);
        if (componentStatus) {
            finalSeverity = componentStatus.severity;
            statusText = ' - Status: ' + componentStatus.text;
        }
        
        // Set severity
        event.severity = finalSeverity;
        
        // Build description
        var description = trapInfo.name + ' (Trap OID: ' + trapOID + ')';
        description += statusText;
        
        // Add additional context if available
        var systemStatusMatch = varbinds.match(new RegExp(dellOIDs.systemStatus + '\\s*=\\s*([^\\r\\n]+)'));
        if (systemStatusMatch) {
            description += '\nSystem Status: ' + systemStatusMatch[1].trim();
        }
        
        event.description = description;
        event.short_description = trapInfo.name + ' on ' + getSourceNode();
    }
    
    /**
     * Get component-specific status information
     */
    function getComponentStatus(component, varbinds) {
        var statusCode = null;
        var statusMap = null;
        
        switch (component.toLowerCase()) {
            case 'power':
                var powerMatch = varbinds.match(new RegExp(dellOIDs.powerSupplyStatus + '\\s*=\\s*(\\d+)'));
                if (powerMatch) {
                    statusCode = parseInt(powerMatch[1]);
                    statusMap = statusMappings.powerSupply;
                }
                break;
                
            case 'temperature':
                var tempMatch = varbinds.match(new RegExp(dellOIDs.temperatureStatus + '\\s*=\\s*(\\d+)'));
                if (tempMatch) {
                    statusCode = parseInt(tempMatch[1]);
                    statusMap = statusMappings.temperature;
                }
                break;
                
            case 'cooling':
                var fanMatch = varbinds.match(new RegExp(dellOIDs.fanStatus + '\\s*=\\s*(\\d+)'));
                if (fanMatch) {
                    statusCode = parseInt(fanMatch[1]);
                    statusMap = statusMappings.general;
                }
                break;
                
            case 'memory':
                var memMatch = varbinds.match(new RegExp(dellOIDs.memoryDeviceStatus + '\\s*=\\s*(\\d+)'));
                if (memMatch) {
                    statusCode = parseInt(memMatch[1]);
                    statusMap = statusMappings.general;
                }
                break;
                
            case 'drive':
            case 'controller':
                var diskMatch = varbinds.match(new RegExp(dellOIDs.physicalDiskStatus + '\\s*=\\s*(\\d+)'));
                var vdiskMatch = varbinds.match(new RegExp(dellOIDs.virtualDiskStatus + '\\s*=\\s*(\\d+)'));
                
                if (diskMatch) {
                    statusCode = parseInt(diskMatch[1]);
                    statusMap = statusMappings.general;
                } else if (vdiskMatch) {
                    statusCode = parseInt(vdiskMatch[1]);
                    statusMap = statusMappings.general;
                }
                break;
                
            case 'nic':
                var nicMatch = varbinds.match(new RegExp(dellOIDs.networkDeviceStatus + '\\s*=\\s*(\\d+)'));
                if (nicMatch) {
                    statusCode = parseInt(nicMatch[1]);
                    statusMap = statusMappings.general;
                }
                break;
                
            default:
                // Use general status mapping
                var generalMatch = varbinds.match(new RegExp(dellOIDs.systemStatus + '\\s*=\\s*(\\d+)'));
                if (generalMatch) {
                    statusCode = parseInt(generalMatch[1]);
                    statusMap = statusMappings.general;
                }
        }
        
        if (statusCode && statusMap && statusMap[statusCode]) {
            return statusMap[statusCode];
        }
        
        return null;
    }
    
    /**
     * Set assignment group based on component type
     */
    function setAssignmentGroup(trapInfo) {
        switch (trapInfo.category.toLowerCase()) {
            case 'storage':
                event.assignment_group = 'Storage-Support';
                break;
            case 'network':
                event.assignment_group = 'Network-Support';
                break;
            case 'management':
            case 'security':
                event.assignment_group = 'Server-Management';
                break;
            default:
                event.assignment_group = 'Hardware-Server-Support';
        }
    }
    
    /**
     * Set additional event fields
     */
    function setAdditionalFields(trapInfo) {
        event.category = trapInfo.category;
        event.subcategory = 'Dell iDRAC ' + getIDRACVersion();
        event.u_vendor = 'Dell';
        event.u_component_type = trapInfo.component;
        event.priority = mapSeverityToPriority(event.severity);
        
        // Set impact and urgency based on severity and component
        setImpactAndUrgency(event.severity, trapInfo.component);
    }
    
    /**
     * Determine iDRAC version based on system information
     */
    function getIDRACVersion() {
        var varbinds = event.additional_info || '';
        var versionMatch = varbinds.match(new RegExp(dellOIDs.idracVersion + '\\s*=\\s*([^\\r\\n]+)'));
        
        if (versionMatch) {
            var version = versionMatch[1].toLowerCase();
            if (version.indexOf('9.') >= 0 || version.indexOf('10.') >= 0) {
                return '9/10';
            } else if (version.indexOf('8.') >= 0) {
                return '8';
            } else if (version.indexOf('7.') >= 0) {
                return '7';
            }
        }
        
        // Try to determine from model name
        var modelMatch = varbinds.match(new RegExp(dellOIDs.systemModelName + '\\s*=\\s*([^\\r\\n]+)'));
        if (modelMatch) {
            var model = modelMatch[1].toLowerCase();
            if (model.indexOf('r750') >= 0 || model.indexOf('r650') >= 0 || model.indexOf('r550') >= 0) {
                return '9/10'; // 15th gen
            } else if (model.indexOf('r740') >= 0 || model.indexOf('r640') >= 0 || model.indexOf('r540') >= 0) {
                return '8/9'; // 14th gen
            } else if (model.indexOf('r730') >= 0 || model.indexOf('r630') >= 0 || model.indexOf('r530') >= 0) {
                return '7/8'; // 13th gen
            }
        }
        
        return '7/8/9'; // Default when version cannot be determined
    }
    
    /**
     * Set impact and urgency based on severity and component criticality
     */
    function setImpactAndUrgency(severity, component) {
        // Critical components that affect entire system
        var criticalComponents = ['cpu', 'power', 'system', 'temperature', 'controller'];
        var isCriticalComponent = criticalComponents.indexOf(component.toLowerCase()) >= 0;
        
        switch (severity) {
            case 1: // Critical
                event.impact = isCriticalComponent ? 1 : 2;
                event.urgency = 1;
                break;
            case 2: // Major
                event.impact = isCriticalComponent ? 2 : 3;
                event.urgency = 2;
                break;
            case 3: // Minor
                event.impact = 3;
                event.urgency = 3;
                break;
            default: // Warning/Info
                event.impact = 4;
                event.urgency = 4;
        }
    }
    
    /**
     * Map severity to priority
     */
    function mapSeverityToPriority(severity) {
        switch (severity) {
            case 1: return 1; // Critical -> Critical
            case 2: return 2; // Major -> High
            case 3: return 3; // Minor -> Moderate
            case 4: return 4; // Warning -> Low
            default: return 5; // Info -> Planning
        }
    }
    
    /**
     * Parse varbinds and extract useful information
     */
    function parseVarbinds() {
        var varbinds = event.additional_info || '';
        
        // Extract OME alert information first (from OM Essentials)
        var omeMessageMatch = varbinds.match(new RegExp(dellOIDs.omeAlertMessage + '\\s*=\\s*([^\\r\\n]+)'));
        if (omeMessageMatch) {
            event.u_ome_alert_message = omeMessageMatch[1].trim();
        }
        
        var omeDeviceMatch = varbinds.match(new RegExp(dellOIDs.omeAlertDevice + '\\s*=\\s*([^\\r\\n]+)'));
        if (omeDeviceMatch) {
            event.u_ome_alert_device = omeDeviceMatch[1].trim();
        }
        
        var omeSeverityMatch = varbinds.match(new RegExp(dellOIDs.omeAlertSeverity + '\\s*=\\s*([^\\r\\n]+)'));
        if (omeSeverityMatch) {
            event.u_ome_alert_severity = omeSeverityMatch[1].trim();
        }
        
        // Extract OpenManage alert system information
        var alertSystemMatch = varbinds.match(new RegExp(dellOIDs.alertSystem + '\\s*=\\s*([^\\r\\n]+)'));
        if (alertSystemMatch) {
            event.u_alert_system = alertSystemMatch[1].trim();
        }
        
        var alertMessageMatch = varbinds.match(new RegExp(dellOIDs.alertMessage + '\\s*=\\s*([^\\r\\n]+)'));
        if (alertMessageMatch) {
            event.u_alert_message = alertMessageMatch[1].trim();
        }
        
        // Extract system information using Dell OIDs
        var serviceTagMatch = varbinds.match(new RegExp(dellOIDs.systemServiceTag + '\\s*=\\s*([^\\r\\n]+)'));
        if (serviceTagMatch) {
            event.u_service_tag = serviceTagMatch[1].trim();
        }
        
        var expressServiceMatch = varbinds.match(new RegExp(dellOIDs.systemExpressServiceCode + '\\s*=\\s*([^\\r\\n]+)'));
        if (expressServiceMatch) {
            event.u_express_service_code = expressServiceMatch[1].trim();
        }
        
        var modelMatch = varbinds.match(new RegExp(dellOIDs.systemModelName + '\\s*=\\s*([^\\r\\n]+)'));
        if (modelMatch) {
            event.u_system_model = modelMatch[1].trim();
        }
        
        var biosMatch = varbinds.match(new RegExp(dellOIDs.systemBIOSVersion + '\\s*=\\s*([^\\r\\n]+)'));
        if (biosMatch) {
            event.u_bios_version = biosMatch[1].trim();
        }
        
        var idracVersionMatch = varbinds.match(new RegExp(dellOIDs.idracVersion + '\\s*=\\s*([^\\r\\n]+)'));
        if (idracVersionMatch) {
            event.u_idrac_version = idracVersionMatch[1].trim();
        }
        
        var idracURLMatch = varbinds.match(new RegExp(dellOIDs.idracURL + '\\s*=\\s*([^\\r\\n]+)'));
        if (idracURLMatch) {
            event.u_idrac_url = idracURLMatch[1].trim();
        }
        
        // Extract temperature information if available
        var tempReadingMatch = varbinds.match(new RegExp(dellOIDs.temperatureReading + '\\s*=\\s*([^\\r\\n]+)'));
        if (tempReadingMatch) {
            event.u_temperature_reading = tempReadingMatch[1].trim();
        }
        
        // Extract fan speed if available
        var fanSpeedMatch = varbinds.match(new RegExp(dellOIDs.fanSpeed + '\\s*=\\s*([^\\r\\n]+)'));
        if (fanSpeedMatch) {
            event.u_fan_speed = fanSpeedMatch[1].trim();
        }
        
        // Store complete varbind information for troubleshooting
        event.u_snmp_varbinds = varbinds;
    }
    
    /**
     * Set correlation information for event grouping
     */
    function setCorrelationInfo(trapInfo) {
        var sourceNode = getSourceNode();
        event.correlation_id = 'Dell_' + sourceNode + '_' + trapInfo.component;
        event.message_key = sourceNode + '_Dell_' + trapInfo.category;
    }
    
    /**
     * Add custom formatting for work notes
     */
    function addWorkNotes() {
        var workNote = 'Dell iDRAC SNMP Trap Processed:\n';
        workNote += '- Source: ' + event.source + '\n';
        workNote += '- Node: ' + event.node + '\n';
        workNote += '- Component: ' + event.u_component_type + '\n';
        workNote += '- Severity: ' + getSeverityText(event.severity) + '\n';
        workNote += '- Category: ' + event.category + '\n';
        workNote += '- iDRAC Version: ' + event.subcategory + '\n';
        
        if (event.u_service_tag) {
            workNote += '- Service Tag: ' + event.u_service_tag + '\n';
        }
        
        if (event.u_express_service_code) {
            workNote += '- Express Service Code: ' + event.u_express_service_code + '\n';
        }
        
        if (event.u_system_model) {
            workNote += '- System Model: ' + event.u_system_model + '\n';
        }
        
        if (event.u_idrac_version) {
            workNote += '- iDRAC Version: ' + event.u_idrac_version + '\n';
        }
        
        if (event.u_idrac_url) {
            workNote += '- iDRAC URL: ' + event.u_idrac_url + '\n';
        }
        
        if (event.u_temperature_reading) {
            workNote += '- Temperature: ' + event.u_temperature_reading + '\n';
        }
        
        if (event.u_fan_speed) {
            workNote += '- Fan Speed: ' + event.u_fan_speed + '\n';
        }
        
        workNote += '\nNote: Hostname automatically cleaned from iDRAC naming conventions (removed suffixes like -idrac, -drac, -r, etc.)';
        
        event.work_notes = workNote;
    }
    
    /**
     * Convert severity number to text
     */
    function getSeverityText(severity) {
        switch (severity) {
            case 1: return 'Critical';
            case 2: return 'Major';
            case 3: return 'Minor';
            case 4: return 'Warning';
            case 5: return 'Info';
            default: return 'Unknown';
        }
    }
    
    // Execute the main processing function
    processDellTrap();
    addWorkNotes();
    
})();