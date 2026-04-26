@echo off
cd /d "C:\Users\theca\work-notes-app"

git add src/App.jsx
if errorlevel 1 goto error

git commit -m "Small app update"
if errorlevel 1 goto error

git push
if errorlevel 1 goto error

echo.
echo Done.
pause
exit /b 0

:error
echo.
echo Something failed. Check the message above.
pause
exit /b 1
