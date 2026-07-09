$proc = Start-Process -FilePath "node" -ArgumentList "node_modules\next\dist\bin\next dev -H 0.0.0.0 -p 3000" -WorkingDirectory "C:\Users\ben azowz\Desktop\مجلد جديد\bupg-stoer-main" -PassThru -NoNewWindow
Write-Output "Started PID: $($proc.Id)"
$proc.Id | Out-File -FilePath "C:\Users\ben azowz\Desktop\مجلد جديد\bupg-stoer-main\.server-pid.txt" -Force
