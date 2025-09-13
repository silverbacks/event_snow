#!/bin/bash

# iLO Hardware Monitor Setup Script
# This script installs and configures the iLO monitoring solution for Telegraf

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="/opt/ilo-monitor"
CONFIG_DIR="/etc/ilo-monitor"
LOG_DIR="/var/log/ilo-monitor"
SYSTEMD_DIR="/etc/systemd/system"
TELEGRAF_CONFIG_DIR="/etc/telegraf/telegraf.d"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root"
        exit 1
    fi
}

check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Python 3
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        print_warning "pip3 not found, installing..."
        if command -v apt-get &> /dev/null; then
            apt-get update
            apt-get install -y python3-pip
        elif command -v yum &> /dev/null; then
            yum install -y python3-pip
        elif command -v dnf &> /dev/null; then
            dnf install -y python3-pip
        else
            print_error "Cannot install pip3 automatically. Please install manually."
            exit 1
        fi
    fi
    
    print_success "Dependencies check completed"
}

install_python_packages() {
    print_status "Installing Python packages..."
    
    pip3 install requests urllib3
    
    print_success "Python packages installed"
}

create_directories() {
    print_status "Creating directories..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOG_DIR"
    
    print_success "Directories created"
}

install_files() {
    print_status "Installing files..."
    
    # Install main script
    cp "$SCRIPT_DIR/ilo_monitor.py" "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/ilo_monitor.py"
    
    # Install configuration file
    if [[ ! -f "$CONFIG_DIR/ilo_config.json" ]]; then
        cp "$SCRIPT_DIR/ilo_config.json" "$CONFIG_DIR/"
        print_warning "Please edit $CONFIG_DIR/ilo_config.json with your iLO credentials"
    else
        print_warning "Configuration file already exists, skipping..."
    fi
    
    # Create symlink for easy access
    ln -sf "$INSTALL_DIR/ilo_monitor.py" /usr/local/bin/ilo-monitor
    
    print_success "Files installed"
}

install_telegraf_config() {
    print_status "Installing Telegraf configuration..."
    
    if [[ ! -d "$TELEGRAF_CONFIG_DIR" ]]; then
        print_warning "Telegraf configuration directory not found. Creating it..."
        mkdir -p "$TELEGRAF_CONFIG_DIR"
    fi
    
    # Update paths in Telegraf config
    sed "s|/path/to/ilo_monitor.py|$INSTALL_DIR/ilo_monitor.py|g" \
        "$SCRIPT_DIR/telegraf_ilo.conf" | \
    sed "s|/path/to/ilo_config.json|$CONFIG_DIR/ilo_config.json|g" \
        > "$TELEGRAF_CONFIG_DIR/ilo_monitor.conf"
    
    print_success "Telegraf configuration installed"
}

create_systemd_service() {
    print_status "Creating systemd service..."
    
    cat > "$SYSTEMD_DIR/ilo-monitor.service" << EOF
[Unit]
Description=iLO Hardware Monitor
After=network.target
Wants=network.target

[Service]
Type=simple
User=telegraf
Group=telegraf
ExecStart=$INSTALL_DIR/ilo_monitor.py --config $CONFIG_DIR/ilo_config.json
Restart=on-failure
RestartSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ilo-monitor

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$LOG_DIR

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    
    print_success "Systemd service created"
}

create_telegraf_user() {
    print_status "Creating telegraf user if not exists..."
    
    if ! id "telegraf" &>/dev/null; then
        useradd -r -s /bin/false -d /var/lib/telegraf telegraf
        print_success "Telegraf user created"
    else
        print_status "Telegraf user already exists"
    fi
}

set_permissions() {
    print_status "Setting permissions..."
    
    # Create telegraf user if not exists
    create_telegraf_user
    
    # Set ownership
    chown -R telegraf:telegraf "$INSTALL_DIR"
    chown -R telegraf:telegraf "$CONFIG_DIR"
    chown -R telegraf:telegraf "$LOG_DIR"
    
    # Set permissions
    chmod 755 "$INSTALL_DIR"
    chmod 644 "$CONFIG_DIR/ilo_config.json"
    chmod 755 "$LOG_DIR"
    
    print_success "Permissions set"
}

install_telegraf() {
    print_status "Checking Telegraf installation..."
    
    if ! command -v telegraf &> /dev/null; then
        print_warning "Telegraf not found. Would you like to install it? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            # Install Telegraf based on OS
            if command -v apt-get &> /dev/null; then
                # Ubuntu/Debian
                wget -qO- https://repos.influxdata.com/influxdb.key | apt-key add -
                echo "deb https://repos.influxdata.com/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/influxdb.list
                apt-get update
                apt-get install -y telegraf
            elif command -v yum &> /dev/null; then
                # RHEL/CentOS 7
                cat > /etc/yum.repos.d/influxdb.repo << EOF
[influxdb]
name = InfluxDB Repository - RHEL \$releasever
baseurl = https://repos.influxdata.com/rhel/\$releasever/\$basearch/stable
enabled = 1
gpgcheck = 1
gpgkey = https://repos.influxdata.com/influxdb.key
EOF
                yum install -y telegraf
            elif command -v dnf &> /dev/null; then
                # RHEL/CentOS 8+
                cat > /etc/yum.repos.d/influxdb.repo << EOF
[influxdb]
name = InfluxDB Repository - RHEL \$releasever
baseurl = https://repos.influxdata.com/rhel/\$releasever/\$basearch/stable
enabled = 1
gpgcheck = 1
gpgkey = https://repos.influxdata.com/influxdb.key
EOF
                dnf install -y telegraf
            else
                print_error "Cannot install Telegraf automatically on this system"
                print_status "Please install Telegraf manually from https://docs.influxdata.com/telegraf/v1.24/install/"
            fi
        fi
    else
        print_success "Telegraf is already installed"
    fi
}

create_test_script() {
    print_status "Creating test script..."
    
    cat > "$INSTALL_DIR/test_monitor.sh" << EOF
#!/bin/bash

# Test script for iLO monitor

echo "Testing iLO monitor..."
echo "========================"

# Test single host
echo "Testing single host mode:"
$INSTALL_DIR/ilo_monitor.py --host ilo.example.com --username admin --password secret --version 5 --output json

echo ""

# Test config file mode
echo "Testing config file mode:"
$INSTALL_DIR/ilo_monitor.py --config $CONFIG_DIR/ilo_config.json --output json

echo ""

# Test Telegraf format
echo "Testing Telegraf format:"
$INSTALL_DIR/ilo_monitor.py --config $CONFIG_DIR/ilo_config.json --output telegraf

echo ""
echo "Test completed. Check the output for any errors."
EOF

    chmod +x "$INSTALL_DIR/test_monitor.sh"
    
    print_success "Test script created at $INSTALL_DIR/test_monitor.sh"
}

show_next_steps() {
    print_success "Installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit the configuration file: $CONFIG_DIR/ilo_config.json"
    echo "2. Add your iLO hostnames, usernames, and passwords"
    echo "3. Test the monitor: $INSTALL_DIR/test_monitor.sh"
    echo "4. Start Telegraf service: systemctl start telegraf"
    echo "5. Enable Telegraf service: systemctl enable telegraf"
    echo "6. Check Telegraf logs: journalctl -u telegraf -f"
    echo ""
    echo "Configuration files:"
    echo "- Main config: $CONFIG_DIR/ilo_config.json"
    echo "- Telegraf config: $TELEGRAF_CONFIG_DIR/ilo_monitor.conf"
    echo "- Monitor script: $INSTALL_DIR/ilo_monitor.py"
    echo ""
    echo "Useful commands:"
    echo "- Test monitor: ilo-monitor --config $CONFIG_DIR/ilo_config.json"
    echo "- View logs: tail -f $LOG_DIR/ilo_monitor.log"
    echo "- Check service: systemctl status ilo-monitor"
}

# Main installation process
main() {
    echo "iLO Hardware Monitor Installation Script"
    echo "======================================="
    echo ""
    
    check_root
    check_dependencies
    install_python_packages
    create_directories
    install_files
    install_telegraf_config
    create_systemd_service
    set_permissions
    install_telegraf
    create_test_script
    show_next_steps
}

# Handle command line arguments
case "${1:-}" in
    "--uninstall")
        print_status "Uninstalling iLO monitor..."
        systemctl stop ilo-monitor 2>/dev/null || true
        systemctl disable ilo-monitor 2>/dev/null || true
        rm -f "$SYSTEMD_DIR/ilo-monitor.service"
        rm -f "$TELEGRAF_CONFIG_DIR/ilo_monitor.conf"
        rm -rf "$INSTALL_DIR"
        rm -f /usr/local/bin/ilo-monitor
        systemctl daemon-reload
        print_success "Uninstallation completed"
        ;;
    "--help"|"-h")
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --uninstall    Remove the iLO monitor installation"
        echo "  --help, -h     Show this help message"
        ;;
    *)
        main
        ;;
esac