$logFile = Join-Path $env:TEMP "dev-server.log"
$process = Start-Process -NoNewWindow -FilePath "cmd.exe" -ArgumentList "/c npm run dev -- --webpack -H 0.0.0.0 > `"$logFile`" 2>&1" -PassThru
Write-Output "PID: $($process.Id)"
Write-Output "Log: $logFile"
