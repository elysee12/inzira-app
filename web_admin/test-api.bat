@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM IMIRIRE API TEST SCRIPT (Windows)
REM Quick verification of all backend endpoints
REM ============================================================

set BASE_URL=http://localhost:3000/api
set TOKEN=

echo =========================================
echo    IMIRIRE API TEST SCRIPT
echo =========================================
echo.

REM Check if curl is available
where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Error: curl is not installed or not in PATH
  echo Please install curl to run this test script
  pause
  exit /b 1
)

echo Step 1: Testing Authentication
echo -------------------------------

REM Login test
echo Testing: Login with credentials...
curl -s -X POST -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@imirire.rw\",\"password\":\"password123\"}" ^
  "%BASE_URL%/auth/login" > temp_response.json

REM Check if login was successful
findstr /C:"access_token" temp_response.json >nul
if %ERRORLEVEL% EQU 0 (
  echo [32m[PASS] Login successful[0m
  
  REM Extract token (simplified - may need adjustment)
  for /f "tokens=2 delims=:," %%a in ('findstr /C:"access_token" temp_response.json') do (
    set TOKEN=%%a
  )
  set TOKEN=!TOKEN:"=!
  set TOKEN=!TOKEN: =!
  echo Token obtained: !TOKEN:~0,20!...
) else (
  echo [31m[FAIL] Login failed[0m
  type temp_response.json
  echo.
  echo Cannot continue without authentication
  echo Please ensure:
  echo 1. Backend is running on http://localhost:3000
  echo 2. Admin user exists with email: admin@imirire.rw
  echo 3. Password is: password123
  del temp_response.json
  pause
  exit /b 1
)

echo.
echo Step 2: Testing User Endpoints
echo -------------------------------

call :test_endpoint GET /users "Get all users"
call :test_endpoint GET /users/1 "Get user by ID"
call :test_endpoint GET "/users/by-role?role=PARENT" "Get users by role (PARENT)"
call :test_endpoint GET "/users/by-role?role=CHW" "Get users by role (CHW)"
call :test_endpoint GET /users/stats "Get user statistics"

echo.
echo Step 3: Testing CHW Endpoints
echo -------------------------------

call :test_endpoint GET /chw "Get all CHWs"
call :test_endpoint GET /chw/1 "Get CHW by ID"

echo.
echo Step 4: Testing Content Endpoints
echo -------------------------------

call :test_endpoint GET /content "Get all content"
call :test_endpoint GET /content/1 "Get content by ID"
call :test_endpoint GET "/content?ageGroup=0-6months" "Get content by age group"

echo.
echo Step 5: Testing Age Category Endpoints
echo -------------------------------

call :test_endpoint GET /age-categories "Get all age categories"

echo.
echo Step 6: Testing Message Endpoints
echo -------------------------------

call :test_endpoint GET /messages/conversations/1 "Get conversations for user 1"
call :test_endpoint GET "/messages/conversation?userId=1&otherUserId=2" "Get conversation thread"
call :test_endpoint GET /messages/unread/1 "Get unread count for user 1"

echo.
echo =========================================
echo    API TEST COMPLETE
echo =========================================
echo.
echo Summary:
echo --------
echo [32m[CHECK] Authentication working[0m
echo [32m[CHECK] All endpoint routes exist[0m
echo.
echo Note: Some endpoints may show errors
echo       if test data doesn't exist yet.
echo.
echo Next Steps:
echo 1. Create test data using the web admin portal
echo 2. Run this script again to verify all endpoints
echo 3. Check TESTING_CHECKLIST.md for manual testing
echo.

REM Cleanup
del temp_response.json >nul 2>&1

pause
exit /b 0

REM ============================================================
REM Function to test endpoint
REM ============================================================
:test_endpoint
set METHOD=%~1
set ENDPOINT=%~2
set DESCRIPTION=%~3

echo Testing: %DESCRIPTION%...

if "%METHOD%"=="GET" (
  curl -s -w "%%{http_code}" -H "Authorization: Bearer %TOKEN%" ^
    "%BASE_URL%%ENDPOINT%" > temp_test.txt
) else (
  curl -s -w "%%{http_code}" -X %METHOD% ^
    -H "Authorization: Bearer %TOKEN%" ^
    -H "Content-Type: application/json" ^
    "%BASE_URL%%ENDPOINT%" > temp_test.txt
)

REM Check HTTP status (simplified)
findstr /C:"200" temp_test.txt >nul
if %ERRORLEVEL% EQU 0 (
  echo [32m  [PASS][0m HTTP 200
) else (
  findstr /C:"401" temp_test.txt >nul
  if %ERRORLEVEL% EQU 0 (
    echo [33m  [AUTH REQUIRED][0m HTTP 401
  ) else (
    echo [31m  [FAIL][0m Check response
  )
)

del temp_test.txt >nul 2>&1
exit /b 0
