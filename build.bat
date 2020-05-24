%~d0
cd "%~dp0"
node.exe node_modules\webpack\bin\webpack.js --config webpack.config.js
del download-faster.zip
cd dist
..\7za.exe a -tzip ..\download-faster.zip *
cd "%~dp0"

