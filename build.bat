%~d0
cd "%~dp0"
npm.exe run build
del download-faster.zip
cd dist
..\7za.exe a -tzip ..\download-faster.zip *
cd "%~dp0"
