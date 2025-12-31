@echo off
echo Creating template ZIP file...
echo.

REM Create a temporary directory for template files
if exist template-temp rmdir /s /q template-temp
mkdir template-temp

REM Copy only template files (not this script, git files, etc.)
copy index.html template-temp\
copy styles.css template-temp\
copy script.js template-temp\
copy config.js template-temp\
copy README.md template-temp\
copy QUICK-START.md template-temp\
copy LICENSE template-temp\
copy .gitignore template-temp\
xcopy /E /I images template-temp\images

REM Create ZIP using PowerShell
powershell Compress-Archive -Path template-temp\* -DestinationPath portfolio-template.zip -Force

REM Clean up
rmdir /s /q template-temp

echo.
echo ✓ Template ZIP created successfully: portfolio-template.zip
echo.
echo You can now deploy your website with the ZIP file included.
pause
