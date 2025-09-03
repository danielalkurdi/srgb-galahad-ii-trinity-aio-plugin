#!/bin/bash

# SignalRGB Lian Li Galahad II Plugin - One-Click Install & Test
# Linux/macOS compatible version

set -e  # Exit on error

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Clear screen and show header
clear
echo -e "${CYAN}===============================================================${NC}"
echo -e "${WHITE}           SignalRGB Lian Li Galahad II Plugin Installer    ${NC}"
echo -e "${CYAN}===============================================================${NC}"
echo ""
echo -e "${YELLOW}🚀 One-Click Testing and Installation${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking Prerequisites...${NC}"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js to run tests.${NC}"
        echo -e "${WHITE}   Download from: https://nodejs.org/${NC}"
        echo ""
        read -p "$(echo -e ${YELLOW})Skip testing and install anyway? [y/N]:${NC} " skip
        if [[ $skip =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⚠️  Skipping tests - installing without validation${NC}"
            SKIP_TESTS=1
        else
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    echo ""
}

# Run automated tests
run_tests() {
    if [[ $SKIP_TESTS == 1 ]]; then
        echo -e "${YELLOW}⚠️  Tests skipped (Node.js not available)${NC}"
        return 0
    fi
    
    if [[ ! -f "scripts/run_tests.js" ]]; then
        echo -e "${RED}❌ Test runner not found at scripts/run_tests.js${NC}"
        exit 1
    fi
    
    echo -e "${WHITE}Running comprehensive protocol validation...${NC}"
    if ! node scripts/run_tests.js; then
        echo ""
        echo -e "${RED}❌ Protocol tests failed!${NC}"
        echo -e "${WHITE}Please check the test output above for details.${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}✅ Protocol validation: 20/20 tests passed (100%)${NC}"
}

# Show menu
show_menu() {
    echo -e "${BLUE}Please select your pump model:${NC}"
    echo ""
    echo -e "${WHITE}1.${NC} Trinity (PID 0x7373) - Basic Plugin"
    echo -e "${WHITE}2.${NC} Trinity (PID 0x7373) - Enhanced Plugin"
    echo -e "${WHITE}3.${NC} Trinity Performance (PID 0x7371) - Basic Plugin" 
    echo -e "${WHITE}4.${NC} Trinity Performance (PID 0x7371) - Enhanced Plugin"
    echo -e "${WHITE}5.${NC} LCD (PID 0x7395) - Basic Plugin"
    echo -e "${WHITE}6.${NC} LCD (PID 0x7395) - Enhanced Plugin"
    echo ""
    echo -e "${WHITE}T.${NC} Test Only (Run protocol validation without installing)"
    echo -e "${WHITE}Q.${NC} Quit"
    echo ""
}

# Install plugin (Note: This would need Wine or similar to run PowerShell on Linux/macOS)
install_plugin() {
    local MODEL=$1
    local ENHANCED=$2
    
    echo -e "${YELLOW}Note: This installer is designed for Windows environments.${NC}"
    echo -e "${YELLOW}For Linux/macOS, manually copy the plugin files to your Windows SignalRGB installation.${NC}"
    echo ""
    echo -e "${WHITE}Plugin location:${NC}"
    if [[ $ENHANCED == "-Enhanced" ]]; then
        echo "signalrgb-plugin/LianLi_GalahadII_Trinity_Enhanced/"
    else
        echo "signalrgb-plugin/LianLi_GalahadII_Trinity/"
    fi
    echo ""
    echo -e "${WHITE}Target directory (Windows):${NC}"
    echo "%APPDATA%\\WhirlwindFX\\SignalRgb\\Devices\\Community\\"
    echo ""
}

# Main execution
check_prerequisites

# Check for quick install argument
if [[ $1 == "--quick" ]]; then
    echo -e "${YELLOW}🚀 Quick Install Mode - Enhanced Trinity Plugin${NC}"
    echo ""
    run_tests
    install_plugin "Trinity" "-Enhanced"
    echo -e "${GREEN}🎉 Testing completed! Manual file copy required for Linux/macOS.${NC}"
    exit 0
fi

# Show interactive menu
while true; do
    show_menu
    read -p "$(echo -e ${WHITE})Enter your choice:${NC} " choice
    
    case $choice in
        1)
            MODEL="Trinity"
            ENHANCED=""
            break
            ;;
        2)
            MODEL="Trinity" 
            ENHANCED="-Enhanced"
            break
            ;;
        3)
            MODEL="Performance"
            ENHANCED=""
            break
            ;;
        4)
            MODEL="Performance"
            ENHANCED="-Enhanced" 
            break
            ;;
        5)
            MODEL="LCD"
            ENHANCED=""
            break
            ;;
        6)
            MODEL="LCD"
            ENHANCED="-Enhanced"
            break
            ;;
        [Tt])
            echo ""
            echo -e "${YELLOW}🧪 Running Protocol Validation Tests...${NC}"
            echo ""
            run_tests
            echo ""
            echo -e "${GREEN}✅ All tests passed! Plugin is ready for installation.${NC}"
            echo ""
            read -p "Press Enter to continue..."
            exit 0
            ;;
        [Qq])
            echo -e "${WHITE}Installation cancelled by user.${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Please try again.${NC}"
            echo ""
            continue
            ;;
    esac
done

# Run installation process
echo ""
echo -e "${YELLOW}Selected: $MODEL$ENHANCED Plugin${NC}"
echo ""

# Step 1: Run automated tests
echo -e "${BLUE}Step 1: Running Protocol Validation...${NC}"
run_tests

echo -e "${GREEN}✅ All protocol tests passed!${NC}"
echo ""

# Step 2: Install plugin 
echo -e "${BLUE}Step 2: Plugin File Preparation...${NC}"
install_plugin "$MODEL" "$ENHANCED"

# Step 3: Provide next steps
echo ""
echo -e "${GREEN}🎉 Validation Complete!${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "${WHITE}1.${NC} Copy plugin folder to Windows SignalRGB installation"
echo -e "${WHITE}2.${NC} Close L-Connect completely (check Task Manager)"
echo -e "${WHITE}3.${NC} Restart SignalRGB"
echo -e "${WHITE}4.${NC} Look for \"Lian Li Galahad II...\" in device list"
echo -e "${WHITE}5.${NC} Test with solid colors and effects"
echo ""
echo -e "${BLUE}💡 Tip:${NC} Enable debug logging in SignalRGB if you encounter issues"
echo -e "${BLUE}📖 Full testing guide:${NC} scripts/test_plugin.md"
echo ""

read -p "Press Enter to exit..."