@echo off
setlocal
rem Project Board launcher (Windows): Chrome/Edge app window, else default browser.
set "HTML="
for %%F in ("%~dp0..\*.html") do if not defined HTML if /i not "%%~nxF"=="index.html" set "HTML=%%~fF"
if not defined HTML for %%F in ("%~dp0..\..\*.html") do if not defined HTML if /i not "%%~nxF"=="index.html" set "HTML=%%~fF"
if not defined HTML (
  echo Board HTML not found. Keep the .html file next to the launchers folder.
  pause
  exit /b 1
)
set "CHROME="
for %%P in (
  "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
  "%LocalAppData%\Google\Chrome\Application\chrome.exe"
  "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
  "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) do if not defined CHROME if exist "%%~P" set "CHROME=%%~P"
if defined CHROME (
  start "" "%CHROME%" --app="file:///%HTML:\=/%" --window-size=1360,860
) else (
  start "" "%HTML%"
)
endlocal
