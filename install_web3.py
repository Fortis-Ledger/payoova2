#!/usr/bin/env python3
"""
Install Web3 dependencies for Payoova 2.0
Run this script if you want real blockchain functionality
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Install web3 and related dependencies"""
    print("⛓️  Installing Web3 Dependencies for Payoova 2.0")
    print("=" * 50)
    print("This will install:")
    print("- web3 (latest compatible version)")
    print("- eth-account")
    print("- eth-keys")
    print()

    # Check if we're in the project directory
    if not os.path.exists('backend'):
        print("❌ Please run this script from the project root directory")
        sys.exit(1)

    # Check if already installed
    try:
        import web3
        print("✅ Web3 is already installed!")
        print(f"Version: {web3.__version__}")
        return True
    except ImportError:
        print("📦 Web3 not found, installing...")

    # Try different installation methods
    installation_methods = [
        {
            "name": "Pre-compiled wheels (Recommended)",
            "command": "pip install web3 eth-account eth-keys --only-binary=all"
        },
        {
            "name": "Latest versions",
            "command": "pip install web3 eth-account eth-keys"
        },
        {
            "name": "Specific versions (fallback)",
            "command": "pip install web3==6.8.0 eth-account==0.8.0 eth-keys==0.4.0"
        }
    ]

    success = False
    for method in installation_methods:
        print(f"\n🔄 Trying: {method['name']}")
        if run_command(method['command'], f"Installing with {method['name']}"):
            success = True
            break
        else:
            print(f"⚠️  {method['name']} failed, trying next method...")

    if not success:
        print("\n❌ All installation methods failed!")
        print("\n🔧 Troubleshooting options:")
        print("1. Install Microsoft C++ Build Tools:")
        print("   https://visualstudio.microsoft.com/visual-cpp-build-tools/")
        print()
        print("2. Use conda instead of pip:")
        print("   conda install web3 eth-account eth-keys")
        print()
        print("3. Use pre-compiled binaries:")
        print("   pip install --upgrade pip")
        print("   pip install web3 eth-account eth-keys --only-binary=all")
        print()
        print("4. Continue without web3 (application works fine with mock data)")
        return False

    # Verify installations
    print("\n🔍 Verifying installations...")
    try:
        import web3
        print(f"✅ web3 - OK (version: {web3.__version__})")
    except ImportError:
        print("❌ web3 - FAILED")
        return False

    try:
        import eth_account
        print("✅ eth-account - OK")
    except ImportError:
        print("❌ eth-account - FAILED")
        return False

    try:
        import eth_keys
        print("✅ eth-keys - OK")
    except ImportError:
        print("❌ eth-keys - FAILED")
        return False

    print("\n🎉 Web3 dependencies installed successfully!")
    print("You can now restart your Payoova application with real blockchain functionality.")
    print("\nTo restart:")
    print("1. Stop your current backend server (Ctrl+C)")
    print("2. Run: python backend/src/main.py")
    print("\nThe application will now use real Web3 instead of mock data.")

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)