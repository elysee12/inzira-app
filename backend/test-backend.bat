@echo off
echo ============================================
echo Backend API - Quick Test
echo ============================================
echo.

echo Testing if backend is running...
echo.

curl -s http://localhost:3000 > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Backend is NOT running!
    echo.
    echo Please start backend first:
    echo   cd d:\project\imirire-app\backend
    echo   npm run start:dev
    echo.
    pause
    exit /b 1
)

echo ✅ Backend is running
echo.

echo Testing endpoints...
echo ----------------------------------------
echo.

echo 1. Testing GET /users/1
curl -s -w "Status: %%{http_code}\n" http://localhost:3000/users/1
echo.

echo 2. Testing GET /messages/conversations/1
curl -s -w "Status: %%{http_code}\n" http://localhost:3000/messages/conversations/1
echo.

echo 3. Testing GET /messages/conversation?userId=1^&otherUserId=2
curl -s -w "Status: %%{http_code}\n" "http://localhost:3000/messages/conversation?userId=1&otherUserId=2"
echo.

echo ============================================
echo Test Complete!
echo ============================================
echo.
echo Expected statuses:
echo   200 = Working ✅
echo   404 = Endpoint not found ❌
echo   500 = Database/code error ❌
echo   401 = Authentication required ⚠️
echo.
pause
