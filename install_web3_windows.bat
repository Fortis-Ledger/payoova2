@echo off
REM Windows batch script for installing web3 dependencies
REM This script tries multiple installation methods for Windows

echo ========================================
echo Installing Web3 for Payoova 2.0 (Windows)
echo ========================================
echo.

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python from https://python.org
    pause
    exit /b 1
)
echo.

echo Upgrading pip...
python -m pip install --upgrade pip
echo.

echo Method 1: Installing with pre-compiled wheels (Recommended)...
pip install web3 eth-account eth-keys --only-binary=all
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Web3 installed with pre-compiled wheels!
    goto :verify
)

echo.
echo Method 1 failed, trying Method 2: Latest versions...
pip install web3 eth-account eth-keys
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Web3 installed with latest versions!
    goto :verify
)

echo.
echo Method 2 failed, trying Method 3: Specific versions...
pip install web3==6.8.0 eth-account==0.8.0 eth-keys==0.4.0
if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Web3 installed with specific versions!
    goto :verify
)

echo.
echo All installation methods failed!
echo.
echo TROUBLESHOOTING OPTIONS:
echo =========================
echo.
echo 1. Install Microsoft Visual C++ Build Tools:
echo    Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
echo    Then run this script again.
echo.
echo 2. Use conda instead:
echo    pip install conda
echo    conda install web3 eth-account eth-keys
echo.
echo 3. Continue without web3:
echo    The application works fine with mock data!
echo.
pause
exit /b 1

:verify
echo.
echo Verifying installation...
python -c "import web3; print('Web3 version:', web3.__version__)" 2>nul
if errorlevel 1 (
    echo ERROR: Web3 verification failed!
    exit /b 1
)

python -c "import eth_account; print('eth-account: OK')" 2>nul
if errorlevel 1 (
    echo ERROR: eth-account verification failed!
    exit /b 1
)

python -c "import eth_keys; print('eth-keys: OK')" 2>nul
if errorlevel 1 (
    echo ERROR: eth-keys verification failed!
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS: All web3 dependencies installed!
echo ========================================
echo.
echo You can now run your Payoova application with real blockchain functionality.
echo.
echo To start:
echo 1. python backend\src\main.py
echo 2. npm run dev (in another terminal)
echo.
pause
exit /b 0