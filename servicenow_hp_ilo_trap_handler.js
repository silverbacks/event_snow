// ServiceNow ITOM Event Field Mapping - Advanced Script for HP/HPE iLO 4/5 SNMP Traps
// This script intercepts SNMP traps from HP/HPE iLO systems and creates properly formatted alerts

(function() {
    
    // HP Enterprise OID prefixes
    var HP_ENTERPRISE_OID = '1.3.6.1.4.1.232';
    var HP_SINFO_ENTERPRISE_OID = '1.3.6.1.4.1.2320'; // System Information traps
    
    // Trap OID to severity and category mapping - Updated with actual HP trap OIDs from MIB files
    var trapInfoMap = {
        // Critical severity traps
        '1.3.6.1.4.1.232.0.1001': { severity: 1, name: 'Processor Status Change', category: 'Hardware', component: 'CPU' },
        '1.3.6.1.4.1.232.0.6001': { severity: 1, name: 'Critical System Error', category: 'System', component: 'System' },
        '1.3.6.1.4.1.2320.11014': { severity: 1, name: 'Critical Software Update', category: 'System', component: 'Software' },
        
        // Major severity traps
        '1.3.6.1.4.1.232.0.1008': { severity: 2, name: 'System Fan Status Change', category: 'Hardware', component: 'Cooling' },
        '1.3.6.1.4.1.232.0.1009': { severity: 2, name: 'CPU Fan Status Change', category: 'Hardware', component: 'Cooling' },
        '1.3.6.1.4.1.232.0.1010': { severity: 2, name: 'Temperature Status Change', category: 'Hardware', component: 'Temperature' },
        '1.3.6.1.4.1.232.0.1011': { severity: 2, name: 'Power Supply Status Change', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.232.0.1014': { severity: 2, name: 'Memory Board Status Change', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.232.0.1007': { severity: 2, name: 'Server Reset', category: 'System', component: 'System' },
        '1.3.6.1.4.1.232.0.11001': { severity: 2, name: 'Rack Power Enclosure Temp Failed', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.232.0.11002': { severity: 2, name: 'Rack Power Supply Status Change', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.232.0.13002': { severity: 2, name: 'Power Supply Status Change Enhanced', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.232.0.13003': { severity: 2, name: 'Power Converter Status Change', category: 'Hardware', component: 'Power' },
        
        // Storage Array traps (from CPQIDA-MIB)
        '1.3.6.1.4.1.232.3.1': { severity: 2, name: 'Controller Status Change', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.3.2': { severity: 2, name: 'Physical Drive Status Change', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3': { severity: 2, name: 'Physical Drive Threshold Passed', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.6': { severity: 2, name: 'Accelerator Battery Failed', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.3.7': { severity: 2, name: 'Logical Drive Status Change', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3001': { severity: 2, name: 'Spare Drive Status Change', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3002': { severity: 2, name: 'Logical Drive Status Change V2', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3003': { severity: 2, name: 'Physical Drive Status Change V2', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3006': { severity: 2, name: 'Accelerator Battery Failed V2', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.3.3007': { severity: 2, name: 'Logical Drive Status Change V3', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3008': { severity: 2, name: 'Spare Drive Status Change V3', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3009': { severity: 2, name: 'Physical Drive Status Change V3', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.232.3.3010': { severity: 2, name: 'Physical Drive Threshold Passed V3', category: 'Storage', component: 'Drive' },
        '1.3.6.1.4.1.2320.2004': { severity: 2, name: 'Monitor Condition Failed', category: 'Hardware', component: 'Monitor' },
        '1.3.6.1.4.1.2320.2010': { severity: 2, name: 'Hot Plug Slot Power Up Failed', category: 'Hardware', component: 'Slot' },
        '1.3.6.1.4.1.2320.2011': { severity: 2, name: 'System Battery Failure', category: 'Hardware', component: 'Battery' },
        '1.3.6.1.4.1.2320.11006': { severity: 2, name: 'NIC Status Failed', category: 'Network', component: 'NIC' },
        '1.3.6.1.4.1.2320.11009': { severity: 2, name: 'NIC Status Failed V2', category: 'Network', component: 'NIC' },
        
        // Minor severity traps
        '1.3.6.1.4.1.232.3.4': { severity: 3, name: 'Accelerator Status Change', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.3.5': { severity: 3, name: 'Accelerator Bad Data', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.3.3004': { severity: 3, name: 'Accelerator Status Change V2', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.3.3005': { severity: 3, name: 'Accelerator Bad Data V2', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.3.3011': { severity: 3, name: 'Accelerator Status Change V3', category: 'Storage', component: 'Controller' },
        '1.3.6.1.4.1.232.0.1013': { severity: 3, name: 'iLO Event Log Status Change', category: 'Management', component: 'iLO' },
        '1.3.6.1.4.1.232.0.6002': { severity: 3, name: 'Non-Critical System Error', category: 'System', component: 'System' },
        '1.3.6.1.4.1.232.0.18002': { severity: 3, name: 'Network Virus Threshold Exceeded', category: 'Network', component: 'Security' },
        '1.3.6.1.4.1.232.0.13001': { severity: 3, name: 'Power Meter Status Change', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.2320.2003': { severity: 3, name: 'Monitor Condition Degraded', category: 'Hardware', component: 'Monitor' },
        '1.3.6.1.4.1.2320.2005': { severity: 3, name: 'Correctable Memory Error Status Degraded', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.2320.2007': { severity: 3, name: 'Memory Configuration Change', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.2320.2008': { severity: 3, name: 'Hot Plug Slot Board Removed', category: 'Hardware', component: 'Slot' },
        '1.3.6.1.4.1.2320.2012': { severity: 3, name: 'System Battery Charging Degraded', category: 'Hardware', component: 'Battery' },
        '1.3.6.1.4.1.2320.2013': { severity: 3, name: 'System Battery Calibration Error', category: 'Hardware', component: 'Battery' },
        '1.3.6.1.4.1.2320.11001': { severity: 3, name: 'Generic Host Trap', category: 'System', component: 'Host' },
        '1.3.6.1.4.1.2320.11002': { severity: 3, name: 'Application Error', category: 'System', component: 'Application' },
        '1.3.6.1.4.1.2320.11003': { severity: 3, name: 'Generic Host Trap V2', category: 'System', component: 'Host' },
        '1.3.6.1.4.1.2320.11004': { severity: 3, name: 'Application Error V2', category: 'System', component: 'Application' },
        '1.3.6.1.4.1.2320.11007': { severity: 3, name: 'NIC Switchover Occurred', category: 'Network', component: 'NIC' },
        '1.3.6.1.4.1.2320.11010': { severity: 3, name: 'NIC Switchover Occurred V2', category: 'Network', component: 'NIC' },
        '1.3.6.1.4.1.2320.11011': { severity: 3, name: 'Process Event', category: 'System', component: 'Process' },
        '1.3.6.1.4.1.2320.11017': { severity: 3, name: 'Software Running Status Change', category: 'System', component: 'Software' },
        
        // Warning severity traps
        '1.3.6.1.4.1.232.0.18001': { severity: 4, name: 'Network Virus Activity', category: 'Network', component: 'Security' },
        '1.3.6.1.4.1.2320.2001': { severity: 4, name: 'Hood Removed', category: 'Security', component: 'Physical' },
        '1.3.6.1.4.1.2320.11012': { severity: 4, name: 'Process Count Warning', category: 'System', component: 'Process' },
        '1.3.6.1.4.1.2320.11015': { severity: 4, name: 'Crash Dump Not Enabled', category: 'System', component: 'System' },
        '1.3.6.1.4.1.2320.11016': { severity: 4, name: 'Boot Paging File Too Small', category: 'System', component: 'Memory' },
        '1.3.6.1.4.1.2320.11018': { severity: 4, name: 'Power Threshold Exceeded', category: 'Hardware', component: 'Power' },
        '1.3.6.1.4.1.2320.11019': { severity: 4, name: 'Boot Paging File or Free Space Too Small', category: 'System', component: 'Memory' },
        
        // Info severity traps (normal/OK status)
        '1.3.6.1.4.1.2320.2002': { severity: 5, name: 'Monitor Condition OK', category: 'Hardware', component: 'Monitor' },
        '1.3.6.1.4.1.2320.2006': { severity: 5, name: 'Correctable Memory Error Status OK', category: 'Hardware', component: 'Memory' },
        '1.3.6.1.4.1.2320.2009': { severity: 5, name: 'Hot Plug Slot Board Inserted', category: 'Hardware', component: 'Slot' },
        '1.3.6.1.4.1.2320.11005': { severity: 5, name: 'NIC Status OK', category: 'Network', component: 'NIC' },
        '1.3.6.1.4.1.2320.11008': { severity: 5, name: 'NIC Status OK V2', category: 'Network', component: 'NIC' },
        '1.3.6.1.4.1.2320.11013': { severity: 5, name: 'Process Count Normal', category: 'System', component: 'Process' }
    };
    
    // Standard SNMP OIDs for varbind parsing
    var standardOIDs = {
        sysUpTime: '1.3.6.1.2.1.1.3.0',
        snmpTrapOID: '1.3.6.1.6.3.1.1.4.1.0',
        sysName: '1.3.6.1.2.1.1.5.0',
        sysDescr: '1.3.6.1.2.1.1.1.0'
    };
    
    // HP-specific OIDs - Updated with actual OIDs from HP MIB files
    var hpOIDs = {
        // Host Management OIDs (from CPQHOST-MIB)
        systemStatus: '1.3.6.1.4.1.232.11.2.10.4.0',
        runningTime: '1.3.6.1.4.1.232.11.2.10.1.0',
        serialNumber: '1.3.6.1.4.1.232.11.2.16.4', // cpqSerialNum
        serverUUID: '1.3.6.1.4.1.232.11.2.16.5', // cpqServerUUID
        
        // System Information OIDs (from CPQSINFO-MIB)
        productName: '1.3.6.1.4.1.232.2.2.4.2', // cpqSiProductName
        systemId: '1.3.6.1.4.1.232.2.2.4.17', // cpqSiServerSystemId
        sysSerialNum: '1.3.6.1.4.1.232.2.2.2.1', // cpqSiSysSerialNum
        memECCCondition: '1.3.6.1.4.1.232.2.2.4.15', // cpqSiMemECCCondition
        monitorOverallCondition: '1.3.6.1.4.1.232.2.2.8.1', // cpqSiMonitorOverallCondition
        systemBatteryOverallCondition: '1.3.6.1.4.1.232.2.2.10.1', // cpqSiSystemBatteryOverallCondition
        hotPlugSlotCondition: '1.3.6.1.4.1.232.2.2.9.2', // cpqSiHotPlugSlotCondition
        
        // Hardware status OIDs (typical structure - may vary by model)
        powerSupplyStatus: '1.3.6.1.4.1.232.6.2.9.3.1.4',
        fanStatus: '1.3.6.1.4.1.232.6.2.6.7.1.9',
        temperatureStatus: '1.3.6.1.4.1.232.6.2.6.8.1.6',
        
        // Storage Array OIDs (from CPQIDA-MIB)
        logicalDriveStatus: '1.3.6.1.4.1.232.3.2.3.1.1.4', // cpqDaLogDrvStatus
        physicalDriveStatus: '1.3.6.1.4.1.232.3.2.5.1.1.6', // cpqDaPhyDrvStatus
        acceleratorStatus: '1.3.6.1.4.1.232.3.2.2.1.1.9', // cpqDaAccelStatus
        spareDriveStatus: '1.3.6.1.4.1.232.3.2.4.1.1.3', // cpqDaSpareStatus
        
        // Memory error count (from health MIBs)
        memoryErrorCount: '1.3.6.1.4.1.232.6.2.5.4.1.7'
    };
    
    // Status code mappings
    var statusMappings = {
        general: {
            1: { text: 'Other', severity: 3 },
            2: { text: 'OK', severity: 5 },
            3: { text: 'Degraded', severity: 4 },
            4: { text: 'Failed', severity: 2 },
            5: { text: 'Missing', severity: 3 }
        },
        powerSupply: {
            1: { text: 'No Error', severity: 5 },
            2: { text: 'General Failure', severity: 2 },
            3: { text: 'BIST Failure', severity: 2 },
            4: { text: 'Fan Failure', severity: 2 },
            5: { text: 'Temperature Failure', severity: 1 },
            6: { text: 'Interlock Open', severity: 3 }
        },
        temperature: {
            1: { text: 'Other', severity: 3 },
            2: { text: 'OK', severity: 5 },
            3: { text: 'Degraded/Warning', severity: 4 },
            4: { text: 'Failed/Critical', severity: 1 }
        }
    };
    
    /**
     * Main function to process HP/HPE iLO SNMP trap
     */
    function processHPiLOTrap() {
        try {
            // Check if this is an HP trap
            if (!isHPTrap()) {
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
            event.type = 'HP iLO Hardware Alert';
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
            gs.log('Error processing HP iLO SNMP trap: ' + error.toString(), 'HP iLO Trap Handler');
        }
    }
    
    /**
     * Check if this is an HP SNMP trap
     */
    function isHPTrap() {
        var trapOID = getTrapOID();
        return trapOID && (trapOID.indexOf(HP_ENTERPRISE_OID) === 0 || trapOID.indexOf(HP_SINFO_ENTERPRISE_OID) === 0);
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
            name: 'Unknown HP Hardware Trap',
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
        
        // If no sysName, try HP-specific product name or system ID
        if (!hostname) {
            var productNameMatch = varbinds.match(new RegExp(hpOIDs.productName + '\\s*=\\s*([^\\r\\n]+)'));
            if (productNameMatch) {
                hostname = productNameMatch[1].trim();
            }
        }
        
        // If still no hostname, try system ID
        if (!hostname) {
            var systemIdMatch = varbinds.match(new RegExp(hpOIDs.systemId + '\\s*=\\s*([^\\r\\n]+)'));
            if (systemIdMatch) {
                hostname = systemIdMatch[1].trim();
            }
        }
        
        // Fallback to event source if available
        if (!hostname && event.source) {
            hostname = event.source.toString();
        }
        
        // Clean up hostname - remove iLO suffixes and common patterns
        if (hostname) {
            hostname = cleanHostname(hostname);
        }
        
        return hostname || 'Unknown HP Server';
    }
    
    /**
     * Clean hostname by removing iLO suffixes and common naming patterns
     */
    function cleanHostname(hostname) {
        if (!hostname) return hostname;
        
        var cleanedName = hostname.toString().trim();
        
        // Remove common iLO suffixes (case insensitive)
        // Order matters - more specific patterns first
        var suffixPatterns = [
            /-con-ilo$/i,       // hostname-con-ilo
            /-con-mgmt$/i,      // hostname-con-mgmt
            /-con-ipmi$/i,      // hostname-con-ipmi
            /-con-bmc$/i,       // hostname-con-bmc
            /-con-idrac$/i,     // hostname-con-idrac
            /-con-oob$/i,       // hostname-con-oob
            /-con-mgt$/i,       // hostname-con-mgt
            /-con-drac$/i,      // hostname-con-drac
            /-con$/i,           // hostname-con
            /r-ilo$/i,          // hostnamer-ilo
            /r-mgmt$/i,         // hostnamer-mgmt
            /r-ipmi$/i,         // hostnamer-ipmi
            /r-bmc$/i,          // hostnamer-bmc
            /r-idrac$/i,        // hostnamer-idrac
            /r-oob$/i,          // hostnamer-oob
            /r-mgt$/i,          // hostnamer-mgt
            /r-drac$/i,         // hostnamer-drac
            /-ilo$/i,           // hostname-ilo
            /-mgmt$/i,          // hostname-mgmt
            /-ipmi$/i,          // hostname-ipmi
            /-bmc$/i,           // hostname-bmc
            /-idrac$/i,         // hostname-idrac
            /-oob$/i,           // hostname-oob (out of band)
            /-mgt$/i,           // hostname-mgt (management)
            /-drac$/i,          // hostname-drac
            /r$/i               // hostnamer (single 'r' suffix)
        ];
        
        // Apply suffix removal patterns
        for (var i = 0; i < suffixPatterns.length; i++) {
            if (suffixPatterns[i].test(cleanedName)) {
                cleanedName = cleanedName.replace(suffixPatterns[i], '');
                break; // Only remove one suffix to avoid over-cleaning
            }
        }
        
        // Remove any trailing hyphens or periods
        cleanedName = cleanedName.replace(/[-\.]+$/, '');
        
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
        var productNameMatch = varbinds.match(new RegExp(hpOIDs.productName + '\\s*=\\s*([^\\r\\n]+)'));
        return productNameMatch ? productNameMatch[1].trim() : 'HP/HPE Server';
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
        var systemStatusMatch = varbinds.match(new RegExp(hpOIDs.systemStatus + '\\s*=\\s*([^\\r\\n]+)'));
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
                var powerMatch = varbinds.match(new RegExp(hpOIDs.powerSupplyStatus + '\\s*=\\s*(\\d+)'));
                if (powerMatch) {
                    statusCode = parseInt(powerMatch[1]);
                    statusMap = statusMappings.powerSupply;
                }
                break;
                
            case 'temperature':
                var tempMatch = varbinds.match(new RegExp(hpOIDs.temperatureStatus + '\\s*=\\s*(\\d+)'));
                if (tempMatch) {
                    statusCode = parseInt(tempMatch[1]);
                    statusMap = statusMappings.temperature;
                }
                break;
                
            case 'cooling':
                var fanMatch = varbinds.match(new RegExp(hpOIDs.fanStatus + '\\s*=\\s*(\\d+)'));
                if (fanMatch) {
                    statusCode = parseInt(fanMatch[1]);
                    statusMap = statusMappings.general;
                }
                break;
                
            case 'drive':
                // Check both logical and physical drive status
                var logicalMatch = varbinds.match(new RegExp(hpOIDs.logicalDriveStatus + '\\s*=\\s*(\\d+)'));
                var physicalMatch = varbinds.match(new RegExp(hpOIDs.physicalDriveStatus + '\\s*=\\s*(\\d+)'));
                
                if (logicalMatch) {
                    statusCode = parseInt(logicalMatch[1]);
                    statusMap = statusMappings.general;
                } else if (physicalMatch) {
                    statusCode = parseInt(physicalMatch[1]);
                    statusMap = statusMappings.general;
                }
                break;
                
            default:
                // Use general status mapping
                statusMap = statusMappings.general;
        }
        
        if (statusCode && statusMap && statusMap[statusCode]) {
            return statusMap[statusCode];
        }
        
        return null;
    }
    
    /**
     * Set assignment group based on hostname patterns, eventFieldMappingScript, and Dynamic CI Grouping
     */
    function setAssignmentGroup(trapInfo) {
        // First priority: Hostname-based routing
        var hostnameGroup = getHostnameBasedAssignmentGroup();
        if (hostnameGroup) {
            event.assignment_group = hostnameGroup;
            return;
        }
        
        // Second priority: EventFieldMappingScript for standardized assignment
        var eventMappingSuccess = eventFieldMappingScript(event, event.sys_id, 'HP iLO Hardware Assignment');
        
        if (!eventMappingSuccess) {
            // Third priority: Dynamic CI Grouping based on source node
            var dynamicGroup = getDynamicAssignmentGroup(event.node, trapInfo);
            
            if (dynamicGroup) {
                event.assignment_group = dynamicGroup;
            } else {
                // Fallback to component-based assignment if all methods fail
                switch (trapInfo.category.toLowerCase()) {
                    case 'storage':
                        event.assignment_group = 'Storage-Support';
                        break;
                    case 'network':
                        event.assignment_group = 'Network-Support';
                        break;
                    case 'management':
                        event.assignment_group = 'Server-Management';
                        break;
                    default:
                        event.assignment_group = 'Hardware-Server-Support';
                }
            }
        }
    }
    
    /**
     * Get assignment group based on iLO hostname patterns (before cleaning)
     */
    function getHostnameBasedAssignmentGroup() {
        // Get the original hostname before cleaning for pattern matching
        var originalHostname = getOriginalHostname();
        if (!originalHostname) {
            return null;
        }
        
        var hostname = originalHostname.toString().toLowerCase();
        
        // Check for -con pattern (UNIX systems)
        if (hostname.indexOf('-con') >= 0) {
            gs.log('HP iLO hostname contains -con pattern, routing to UNIX-SUPPORT: ' + originalHostname, 'HP iLO Hostname Routing');
            return 'UNIX-SUPPORT';
        }
        
        // Check for 'r' pattern (Windows systems)
        if (hostname.indexOf('r') >= 0) {
            gs.log('HP iLO hostname contains r pattern, routing to WINDOWS-SERVER-TEAM: ' + originalHostname, 'HP iLO Hostname Routing');
            return 'WINDOWS-SERVER-TEAM';
        }
        
        // No hostname pattern matched
        return null;
    }
    
    /**
     * Get original hostname before cleaning for pattern matching
     */
    function getOriginalHostname() {
        var varbinds = event.additional_info || '';
        var hostname = null;
        
        // Try to get hostname from sysName first (most reliable)
        var sysNameMatch = varbinds.match(new RegExp(standardOIDs.sysName + '\\s*=\\s*([^\\r\\n]+)'));
        if (sysNameMatch) {
            hostname = sysNameMatch[1].trim();
        }
        
        // If no sysName, try HP-specific product name or system ID
        if (!hostname) {
            var productNameMatch = varbinds.match(new RegExp(hpOIDs.productName + '\\s*=\\s*([^\\r\\n]+)'));
            if (productNameMatch) {
                hostname = productNameMatch[1].trim();
            }
        }
        
        // If still no hostname, try system ID
        if (!hostname) {
            var systemIdMatch = varbinds.match(new RegExp(hpOIDs.systemId + '\\s*=\\s*([^\\r\\n]+)'));
            if (systemIdMatch) {
                hostname = systemIdMatch[1].trim();
            }
        }
        
        // Fallback to event source if available
        if (!hostname && event.source) {
            hostname = event.source.toString();
        }
        
        return hostname;
    }
    
    /**
     * Get Dynamic Assignment Group based on CI and component type
     */
    function getDynamicAssignmentGroup(nodeName, trapInfo) {
        try {
            // Query CMDB to find the CI for this node
            var ciGR = new GlideRecord('cmdb_ci');
            ciGR.addQuery('name', nodeName);
            ciGR.addOrCondition('fqdn', nodeName);
            ciGR.addOrCondition('ip_address', nodeName);
            ciGR.query();
            
            if (ciGR.next()) {
                var ciSysId = ciGR.getValue('sys_id');
                var ciClass = ciGR.getValue('sys_class_name');
                
                // Look for Dynamic CI Grouping rules
                var groupRule = findCIGroupingRule(ciSysId, ciClass, trapInfo);
                if (groupRule) {
                    return groupRule;
                }
                
                // Check for CI-specific assignment groups in relationships
                var relatedGroup = getCIRelatedAssignmentGroup(ciSysId, trapInfo.category);
                if (relatedGroup) {
                    return relatedGroup;
                }
            }
            
            return null;
        } catch (error) {
            gs.log('Error in getDynamicAssignmentGroup: ' + error.toString(), 'HP iLO Dynamic Assignment');
            return null;
        }
    }
    
    /**
     * Find CI Grouping Rule based on CI class and component type
     */
    function findCIGroupingRule(ciSysId, ciClass, trapInfo) {
        // Check for custom CI grouping rules table (if exists)
        // This would be a custom table: u_ci_grouping_rules
        var ruleGR = new GlideRecord('u_ci_grouping_rules');
        if (ruleGR.isValid()) {
            ruleGR.addQuery('active', true);
            ruleGR.addQuery('ci_class', ciClass);
            ruleGR.addQuery('component_category', trapInfo.category.toLowerCase());
            ruleGR.orderBy('order');
            ruleGR.query();
            
            if (ruleGR.next()) {
                return ruleGR.getValue('assignment_group');
            }
        }
        
        // Fallback: Check business service relationships
        return getBusinessServiceAssignmentGroup(ciSysId, trapInfo.category);
    }
    
    /**
     * Get assignment group from CI relationships (business services, applications)
     */
    function getCIRelatedAssignmentGroup(ciSysId, category) {
        // Check if CI is related to business services
        var relGR = new GlideRecord('cmdb_rel_ci');
        relGR.addQuery('child', ciSysId);
        relGR.addQuery('parent.sys_class_name', 'STARTSWITH', 'cmdb_ci_service');
        relGR.query();
        
        if (relGR.next()) {
            var serviceGR = new GlideRecord('cmdb_ci_service');
            if (serviceGR.get(relGR.getValue('parent'))) {
                // Check if business service has specific assignment groups
                var assignmentGroup = getServiceAssignmentGroup(serviceGR, category);
                if (assignmentGroup) {
                    return assignmentGroup;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get assignment group from business service based on category
     */
    function getBusinessServiceAssignmentGroup(ciSysId, category) {
        // Look for business service mappings
        var bsRelGR = new GlideRecord('cmdb_rel_ci');
        bsRelGR.addQuery('child', ciSysId);
        bsRelGR.addQuery('parent.sys_class_name', 'cmdb_ci_service_discovered');
        bsRelGR.query();
        
        while (bsRelGR.next()) {
            var serviceGR = new GlideRecord('cmdb_ci_service_discovered');
            if (serviceGR.get(bsRelGR.getValue('parent'))) {
                // Check service's support groups based on category
                var supportGroup = null;
                
                switch (category.toLowerCase()) {
                    case 'storage':
                        supportGroup = serviceGR.getValue('u_storage_support_group') || 
                                     serviceGR.getValue('support_group');
                        break;
                    case 'network':
                        supportGroup = serviceGR.getValue('u_network_support_group') || 
                                     serviceGR.getValue('support_group');
                        break;
                    case 'management':
                        supportGroup = serviceGR.getValue('u_management_support_group') || 
                                     serviceGR.getValue('support_group');
                        break;
                    default:
                        supportGroup = serviceGR.getValue('support_group');
                }
                
                if (supportGroup) {
                    return supportGroup;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get assignment group from service based on component category
     */
    function getServiceAssignmentGroup(serviceGR, category) {
        // Check for category-specific support groups in the service CI
        var supportGroup = null;
        
        switch (category.toLowerCase()) {
            case 'storage':
                supportGroup = serviceGR.getValue('u_storage_support_group');
                break;
            case 'network':
                supportGroup = serviceGR.getValue('u_network_support_group');
                break;
            case 'management':
                supportGroup = serviceGR.getValue('u_management_support_group');
                break;
        }
        
        // Fallback to general support group
        if (!supportGroup) {
            supportGroup = serviceGR.getValue('support_group');
        }
        
        return supportGroup;
    }
    
    /**
     * Set additional event fields
     */
    function setAdditionalFields(trapInfo) {
        event.category = trapInfo.category;
        event.subcategory = 'HP iLO ' + getILOVersion();
        event.u_vendor = 'HP/HPE';
        event.u_component_type = trapInfo.component;
        event.priority = mapSeverityToPriority(event.severity);
        
        // Set impact and urgency based on severity and component
        setImpactAndUrgency(event.severity, trapInfo.component);
    }
    
    /**
     * Determine iLO version based on system information
     */
    function getILOVersion() {
        var varbinds = event.additional_info || '';
        var productMatch = varbinds.match(new RegExp(hpOIDs.productName + '\\s*=\\s*([^\\r\\n]+)'));
        
        if (productMatch) {
            var product = productMatch[1].toLowerCase();
            if (product.indexOf('gen10') >= 0 || product.indexOf('gen11') >= 0) {
                return '5';
            } else if (product.indexOf('gen8') >= 0 || product.indexOf('gen9') >= 0) {
                return '4';
            }
        }
        
        return '4/5'; // Default when version cannot be determined
    }
    
    /**
     * Set impact and urgency based on severity and component criticality
     */
    function setImpactAndUrgency(severity, component) {
        // Critical components that affect entire system
        var criticalComponents = ['cpu', 'power', 'system', 'temperature'];
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
        
        // Extract system information using correct OIDs
        var serialMatch = varbinds.match(new RegExp(hpOIDs.serialNumber + '\\s*=\\s*([^\\r\\n]+)'));
        if (serialMatch) {
            event.u_serial_number = serialMatch[1].trim();
        } else {
            // Try alternative serial number OID
            var altSerialMatch = varbinds.match(new RegExp(hpOIDs.sysSerialNum + '\\s*=\\s*([^\\r\\n]+)'));
            if (altSerialMatch) {
                event.u_serial_number = altSerialMatch[1].trim();
            }
        }
        
        var systemIdMatch = varbinds.match(new RegExp(hpOIDs.systemId + '\\s*=\\s*([^\\r\\n]+)'));
        if (systemIdMatch) {
            event.u_system_id = systemIdMatch[1].trim();
        }
        
        var runningTimeMatch = varbinds.match(new RegExp(hpOIDs.runningTime + '\\s*=\\s*([^\\r\\n]+)'));
        if (runningTimeMatch) {
            event.u_system_uptime = runningTimeMatch[1].trim();
        }
        
        // Extract memory error information if available
        var memErrorMatch = varbinds.match(new RegExp(hpOIDs.memoryErrorCount + '\\s*=\\s*([^\\r\\n]+)'));
        if (memErrorMatch) {
            event.u_memory_errors = memErrorMatch[1].trim();
        }
        
        // Extract ECC condition if available
        var eccConditionMatch = varbinds.match(new RegExp(hpOIDs.memECCCondition + '\\s*=\\s*([^\\r\\n]+)'));
        if (eccConditionMatch) {
            event.u_memory_ecc_condition = eccConditionMatch[1].trim();
        }
        
        // Store complete varbind information for troubleshooting
        event.u_snmp_varbinds = varbinds;
    }
    
    /**
     * Set correlation information for event grouping
     */
    function setCorrelationInfo(trapInfo) {
        var sourceNode = getSourceNode();
        event.correlation_id = 'HP_' + sourceNode + '_' + trapInfo.component;
        event.message_key = sourceNode + '_HP_' + trapInfo.category;
    }
    
    /**
     * Add custom formatting for work notes
     */
    function addWorkNotes() {
        var workNote = 'HP/HPE iLO SNMP Trap Processed:\n';
        workNote += '- Source: ' + event.source + '\n';
        workNote += '- Node: ' + event.node + '\n';
        workNote += '- Component: ' + event.u_component_type + '\n';
        workNote += '- Severity: ' + getSeverityText(event.severity) + '\n';
        workNote += '- Category: ' + event.category + '\n';
        workNote += '- iLO Version: ' + event.subcategory + '\n';
        
        if (event.u_serial_number) {
            workNote += '- Serial Number: ' + event.u_serial_number + '\n';
        }
        
        if (event.u_system_id) {
            workNote += '- System ID: ' + event.u_system_id + '\n';
        }
        
        if (event.u_memory_errors && event.u_memory_errors !== '0') {
            workNote += '- Memory Errors: ' + event.u_memory_errors + '\n';
        }
        
        workNote += '\nNote: Hostname automatically cleaned from iLO naming conventions (removed suffixes like -con, -ilo, -r, etc.)';
        
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
    
    /**
     * ServiceNow Event Field Mapping Script for HP/HPE iLO Hardware Events
     * Provides standardized event field mapping with component-based routing
     * 
     * Official ServiceNow Event Field Mapping Script Pattern
     * @param {GlideRecord} eventGr - The event GlideRecord being processed
     * @param {string} origEventSysId - Original event system ID
     * @param {string} fieldMappingRuleName - Rule name for logging purposes
     */
    function eventFieldMappingScript(eventGr, origEventSysId, fieldMappingRuleName) {
        // Make any changes to the alert which will be created out of this Event
        // Note that the Event itself is immutable, and will not be changed in the database.
        // You can set the values on the eventGr, e.g. eventGr.setValue(...), but don't perform an update with eventGr.update().
        // To abort the changes in the event record, return false;
        // Returning a value other than boolean will result in an error
        
        try {
            // Enhanced field mapping for HP/HPE iLO events
            var source = eventGr.getValue('source') || eventGr.getValue('node') || 'unknown';
            var category = eventGr.getValue('category') || 'Hardware';
            
            // Set assignment group based on component category with HP-specific routing
            var assignmentGroup = null;
            
            switch (category.toLowerCase()) {
                case 'storage':
                    assignmentGroup = 'Storage-Support';
                    break;
                case 'network':
                    assignmentGroup = 'Network-Support';
                    break;
                case 'management':
                    assignmentGroup = 'Server-Management';
                    break;
                default:
                    assignmentGroup = 'Hardware-Server-Support';
            }
            
            if (assignmentGroup) {
                eventGr.setValue('assignment_group', assignmentGroup);
            }
            
            // Set additional standardized fields for HP events
            if (!eventGr.getValue('u_vendor')) {
                eventGr.setValue('u_vendor', 'HP/HPE');
            }
            
            // Ensure consistent event type
            if (!eventGr.getValue('type')) {
                eventGr.setValue('type', 'HP iLO Hardware Alert');
            }
            
            // Log successful assignment
            gs.log('HP/HPE iLO event processed via eventFieldMappingScript - Source: ' + source + ', Category: ' + category + ', Assignment: ' + assignmentGroup, 'HP iLO Assignment');
            
            return true;
            
        } catch (e) {
            gs.error("The script type mapping rule '" + fieldMappingRuleName + "' ran with the error: \n" + e);
            return false;
        }
    }
    
    // Execute the main processing function
    processHPiLOTrap();
    addWorkNotes();
    
})();