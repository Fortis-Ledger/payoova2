#!/usr/bin/env python3
"""
Alternative Web3 installation using conda for Windows
This script provides conda-based installation for web3 dependencies
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

def check_conda():
    """Check if conda is available"""
    try:
        result = subprocess.run("conda --version", shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Conda found: {result.stdout.strip()}")
            return True
    except:
        pass
    return False

def main():
    """Install web3 using conda"""
    print("🐍 Installing Web3 Dependencies with Conda (Windows)")
    print("=" * 55)

    # Check if conda is available
    if not check_conda():
        print("❌ Conda not found!")
        print("\nTo install conda:")
        print("1. Download Miniconda: https://docs.conda.io/en/latest/miniconda.html")
        print("2. Install and restart your terminal")
        print("3. Run this script again")
        print("\nAlternatively, use the regular pip installer:")
        print("python install_web3.py")
        sys.exit(1)

    # Check if we're in the project directory
    if not os.path.exists('backend'):
        print("❌ Please run this script from the project root directory")
        sys.exit(1)

    # Create conda environment if it doesn't exist
    env_name = "payoova-web3"
    print(f"\n🏗️  Setting up conda environment: {env_name}")

    # Check if environment exists
    result = subprocess.run(f"conda env list | findstr {env_name}",
                          shell=True, capture_output=True, text=True)

    if env_name not in result.stdout:
        print(f"Creating new conda environment: {env_name}")
        if not run_command(f"conda create -n {env_name} python=3.9 -y",
                          "Creating conda environment"):
            sys.exit(1)
    else:
        print(f"Using existing conda environment: {env_name}")

    # Activate environment and install packages
    print("\n📦 Installing web3 dependencies...")
    install_commands = [
        f"conda activate {env_name} && pip install web3 eth-account eth-keys",
        f"conda activate {env_name} && conda install -c conda-forge coincurve -y"
    ]

    success = False
    for cmd in install_commands:
        if run_command(cmd, "Installing web3 packages"):
            success = True
            break

    if not success:
        print("\n❌ Conda installation failed!")
        print("\nAlternative methods:")
        print("1. Use pip with pre-compiled wheels:")
        print("   pip install web3 eth-account eth-keys --only-binary=all")
        print()
        print("2. Install Microsoft Visual C++ Build Tools:")
        print("   https://visualstudio.microsoft.com/visual-cpp-build-tools/")
        print()
        print("3. Use WSL (Windows Subsystem for Linux)")
        return False

    # Verify installations
    print("\n🔍 Verifying installations...")
    verify_cmd = f"conda activate {env_name} && python -c \"import web3; print('Web3 version:', web3.__version__)\""
    if run_command(verify_cmd, "Verifying web3 installation"):
        print("✅ Web3 installation successful!")
    else:
        print("❌ Web3 verification failed")
        return False

    print("\n🎉 Web3 dependencies installed successfully!")
    print(f"Conda environment: {env_name}")
    print("\nTo use this environment:")
    print(f"1. Activate: conda activate {env_name}")
    print("2. Run your application: python backend/src/main.py")
    print("\nTo deactivate: conda deactivate")

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)