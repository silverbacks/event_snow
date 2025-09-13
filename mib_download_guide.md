# MIB File Download Guide for ServiceNow ITOM

## Overview
This guide provides direct links and step-by-step instructions to download all required MIB files for both NetApp CDOT 9.14 and HP/HPE iLO 4/5 SNMP trap handling.

## NetApp CDOT 9.14 MIB Files

### Required NetApp MIBs
- **NETAPP-MIB.txt** (Primary NetApp enterprise MIB)
- **NETAPP-TRAPS-MIB.txt** (NetApp trap definitions)
- **NETAPP-TC.txt** (NetApp textual conventions)

### Download Instructions

#### Method 1: NetApp Support Site (Requires Login)
1. **Go to**: https://mysupport.netapp.com/
2. **Login** with NetApp support credentials
3. **Navigate**: Support > Downloads > Software
4. **Select**: ONTAP > ONTAP 9.14.x > Management Software
5. **Download**: "ONTAP System Manager" or "Management Software Package"
6. **Extract**: Look for MIB files in `/mibs/` directory

#### Method 2: Direct NetApp Developer Resources
1. **Go to**: https://library.netapp.com/ecmdocs/ECMP1196991/html/index.html
2. **Navigate**: ONTAP 9 Documentation > Management > SNMP
3. **Download**: MIB files from documentation appendix

#### Method 3: GitHub NetApp Community (Alternative)
```bash
# Clone NetApp community repository (if available)
git clone https://github.com/NetApp/ontap-rest-python
# Check for MIB files in examples or tools directory
```

### NetApp MIB File Locations After Download
```
netapp-management-software/
├── mibs/
│   ├── NETAPP-MIB.txt
│   ├── NETAPP-TRAPS-MIB.txt
│   └── NETAPP-TC.txt
└── documentation/
```

## HP/HPE iLO 4/5 MIB Files

### Required HP MIBs
- **CPQHOST-MIB.txt** (HP Host MIB)
- **CPQSINFO-MIB.txt** (HP System Information MIB)
- **CPQHLTH-MIB.txt** (HP Health MIB)
- **CPQIDA-MIB.txt** (HP Array Controller MIB)
- **CPQNIC-MIB.txt** (HP Network Interface MIB)
- **CPQPOWER-MIB.txt** (HP Power MIB)
- **CPQSTDEQ-MIB.txt** (HP Standard Equipment MIB)

### Download Instructions

#### Method 1: HP Enterprise Support (Requires Login)
1. **Go to**: https://support.hpe.com/
2. **Login** with HP support credentials
3. **Navigate**: Support > Software Downloads
4. **Search**: "ProLiant Support Pack" or "PSP"
5. **Select**: Latest version for your server generation
6. **Download**: Full PSP package (includes MIB files)

#### Method 2: HP Systems Insight Manager (SIM)
1. **Go to**: https://support.hpe.com/
2. **Search**: "HP Systems Insight Manager"
3. **Download**: HP SIM installation package
4. **Extract**: MIB files from installation media

#### Method 3: Individual MIB Downloads
**Direct Links** (may require HP support login):

```
HP Host MIB:
https://support.hpe.com/hpesc/public/docDisplay?docId=c04154426

HP Health MIB:
https://support.hpe.com/hpesc/public/docDisplay?docId=c04154427

HP Storage MIB:
https://support.hpe.com/hpesc/public/docDisplay?docId=c04154428
```

#### Method 4: Alternative Sources
```bash
# Check if your server has MIB files locally
# SSH to HP server and check:
find /usr -name "*.mib" -o -name "*MIB*"
find /opt -name "*.mib" -o -name "*MIB*"

# Common locations on HP servers:
/usr/share/snmp/mibs/
/opt/hp/hp-snmp-agents/mibs/
```

### HP MIB File Locations After Download
```
hp-proliant-support-pack/
├── mibs/
│   ├── CPQHOST-MIB.txt
│   ├── CPQSINFO-MIB.txt
│   ├── CPQHLTH-MIB.txt
│   ├── CPQIDA-MIB.txt
│   ├── CPQNIC-MIB.txt
│   ├── CPQPOWER-MIB.txt
│   └── CPQSTDEQ-MIB.txt
├── agents/
└── documentation/
```

## Standard MIB Files (Required for Both)

### RFC Standard MIBs
These are usually included with SNMP software but can be downloaded separately:

#### Download Locations:
1. **IETF RFC Repository**: https://www.rfc-editor.org/
2. **Net-SNMP Project**: http://www.net-snmp.org/
3. **SNMP Research**: http://www.snmp.com/mibs/

#### Required Standard MIBs:
```
RFC1213-MIB.txt    - MIB-II (Standard system MIB)
SNMPv2-MIB.txt     - SNMPv2 definitions
SNMPv2-TC.txt      - SNMPv2 textual conventions
SNMPv2-SMI.txt     - SNMPv2 SMI definitions
SNMPv2-CONF.txt    - SNMPv2 conformance statements
```

#### Direct Download Commands:
```bash
# Download standard MIBs
wget https://www.rfc-editor.org/rfc/rfc1213.txt
wget https://www.rfc-editor.org/rfc/rfc3418.txt

# Or from Net-SNMP
wget http://www.net-snmp.org/docs/mibs/
```

## Alternative MIB Sources

### Public MIB Repositories
1. **MIB Depot**: http://www.mibdepot.com/
2. **OID Repository**: http://oid-info.com/
3. **SNMP Link**: http://www.snmplink.org/

### GitHub Repositories
```bash
# Community MIB collections
git clone https://github.com/cisco/cisco-mibs
git clone https://github.com/netsnmp/net-snmp

# Search for specific vendor MIBs
# Use GitHub search: "NETAPP-MIB" or "CPQHOST-MIB"
```

## MIB File Installation Instructions

### For ServiceNow MID Server (Linux)
```bash
# Create MIB directories
sudo mkdir -p /opt/servicenow/mid/agent/mib/netapp
sudo mkdir -p /opt/servicenow/mid/agent/mib/hp
sudo mkdir -p /opt/servicenow/mid/agent/mib/standard

# Copy NetApp MIBs
sudo cp NETAPP-*.txt /opt/servicenow/mid/agent/mib/netapp/

# Copy HP MIBs  
sudo cp CPQHOST-MIB.txt /opt/servicenow/mid/agent/mib/hp/
sudo cp CPQSINFO-MIB.txt /opt/servicenow/mid/agent/mib/hp/
sudo cp CPQHLTH-MIB.txt /opt/servicenow/mid/agent/mib/hp/
sudo cp CPQIDA-MIB.txt /opt/servicenow/mid/agent/mib/hp/
sudo cp CPQNIC-MIB.txt /opt/servicenow/mid/agent/mib/hp/
sudo cp CPQPOWER-MIB.txt /opt/servicenow/mid/agent/mib/hp/

# Copy standard MIBs
sudo cp RFC1213-MIB.txt /opt/servicenow/mid/agent/mib/standard/
sudo cp SNMPv2-*.txt /opt/servicenow/mid/agent/mib/standard/

# Set permissions
sudo chown -R mid:mid /opt/servicenow/mid/agent/mib/
sudo chmod -R 644 /opt/servicenow/mid/agent/mib/*.txt
```

### For Windows MID Server
```cmd
# Create directories
mkdir "C:\ServiceNow\MID\agent\mib\netapp"
mkdir "C:\ServiceNow\MID\agent\mib\hp" 
mkdir "C:\ServiceNow\MID\agent\mib\standard"

# Copy files to appropriate directories
copy NETAPP-*.txt "C:\ServiceNow\MID\agent\mib\netapp\"
copy CPQHOST-*.txt "C:\ServiceNow\MID\agent\mib\hp\"
copy RFC1213-*.txt "C:\ServiceNow\MID\agent\mib\standard\"
```

## MIB Validation and Testing

### Validate MIB Files
```bash
# Test MIB compilation
snmptranslate -M /opt/servicenow/mid/agent/mib -m ALL 1.3.6.1.4.1.789
snmptranslate -M /opt/servicenow/mid/agent/mib -m ALL 1.3.6.1.4.1.232

# Check for syntax errors
libsmi -p /opt/servicenow/mid/agent/mib NETAPP-MIB
libsmi -p /opt/servicenow/mid/agent/mib CPQHOST-MIB
```

### Test SNMP Queries
```bash
# Test NetApp SNMP
snmpwalk -v2c -c public <netapp-ip> 1.3.6.1.4.1.789.1.1.2.0

# Test HP SNMP
snmpwalk -v2c -c public <hp-ilo-ip> 1.3.6.1.4.1.232.2.2.4.2.0
```

## Troubleshooting MIB Downloads

### Common Issues:

1. **Access Denied**: 
   - Ensure you have valid support contracts
   - Contact vendor support for access

2. **MIB Files Not Found**:
   - Check different product versions
   - Look in firmware/software packages

3. **Older MIB Versions**:
   - Download latest firmware packages
   - Check vendor documentation for MIB updates

### Support Contacts:

**NetApp Support**:
- Phone: Contact through support.netapp.com
- Email: Via support case system
- Documentation: docs.netapp.com

**HP Enterprise Support**:
- Phone: Contact through support.hpe.com  
- Email: Via support case system
- Documentation: support.hpe.com/documentation

## Quick Reference Commands

### Download Verification
```bash
# Check file sizes and dates
ls -la /opt/servicenow/mid/agent/mib/*/*.txt

# Verify MIB content
head -20 NETAPP-MIB.txt
head -20 CPQHOST-MIB.txt

# Count OID definitions
grep -c "OBJECT IDENTIFIER" *.txt
```

This guide should help you locate and download all the required MIB files. If you encounter access issues with vendor sites, contact their support teams or check if your organization has existing support contracts that provide access to these resources.