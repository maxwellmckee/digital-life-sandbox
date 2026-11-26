# Runs the Digital Life Sandbox test suite in a fresh headless Chrome (or Edge) and prints PASS or FAIL for each check.
# Usage, from the project folder:  .\tests\run.ps1        Optional: -Only "Saved dish reopens exactly"  -Port 8790
# The browser profile is a new temporary one each run, so the checks never see your own saves or settings.
param([int]$Port = 8790, [string]$Only = '', [string]$Browser = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$page = Join-Path $root 'digital_life.html'
$suite = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'suite.js'))

if (-not $Browser) {
  $Browser = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
  ) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
}
if (-not $Browser) { throw 'Chrome or Edge was not found. Pass its path with -Browser.' }

# The page is served from localhost, which WebGPU and private storage need.
$server = Start-Job -ArgumentList $page, $Port -ScriptBlock {
  param($page, $port)
  $listener = [System.Net.HttpListener]::new()
  $listener.Prefixes.Add("http://localhost:$port/")
  $listener.Start()
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $bytes = [System.IO.File]::ReadAllBytes($page)
    $context.Response.ContentType = 'text/html; charset=utf-8'
    $context.Response.Headers.Add('Cache-Control', 'no-store')
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $context.Response.Close()
  }
}
$profileDir = Join-Path ([IO.Path]::GetTempPath()) "digital-life-tests-$PID"
$debugPort = $Port + 1
$browserProcess = $null
$failed = 0
try {
  for ($i = 0; $i -lt 40; $i++) { try { Invoke-WebRequest "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 2 | Out-Null; break } catch { Start-Sleep -Milliseconds 250 } }
  $browserProcess = Start-Process -FilePath $Browser -PassThru -WindowStyle Hidden -ArgumentList @(
    '--headless=new', "--user-data-dir=$profileDir", '--no-first-run', '--no-default-browser-check',
    "--remote-debugging-port=$debugPort", '--window-size=1600,1000', '--hide-scrollbars', "http://localhost:$Port/")
  $targets = $null
  for ($i = 0; $i -lt 60 -and -not $targets; $i++) { Start-Sleep -Milliseconds 250; try { $targets = Invoke-RestMethod "http://127.0.0.1:$debugPort/json" } catch {} }
  $target = $targets | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
  Start-Sleep -Seconds 6 # The page starts its GPU and grows its first organism.
  $ws = [System.Net.WebSockets.ClientWebSocket]::new()
  $ws.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
  $script:id = 0
  function Invoke-Page([string]$expression) {
    $script:id++
    $message = @{ id = $script:id; method = 'Runtime.evaluate'; params = @{ expression = $expression; awaitPromise = $true; returnByValue = $true } } | ConvertTo-Json -Depth 5 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($message)
    $ws.SendAsync([ArraySegment[byte]]::new($bytes), 'Text', $true, [Threading.CancellationToken]::None).Wait()
    $buffer = New-Object byte[] 4194304
    while ($true) {
      $text = [Text.StringBuilder]::new()
      do {
        $receive = $ws.ReceiveAsync([ArraySegment[byte]]::new($buffer), [Threading.CancellationToken]::None)
        if (-not $receive.Wait(900000)) { throw 'The page stopped answering.' }
        [void]$text.Append([Text.Encoding]::UTF8.GetString($buffer, 0, $receive.Result.Count))
      } while (-not $receive.Result.EndOfMessage)
      $reply = $text.ToString() | ConvertFrom-Json
      if ($reply.id -eq $script:id) {
        if ($reply.result.exceptionDetails) { throw ($reply.result.exceptionDetails | ConvertTo-Json -Depth 6 -Compress) }
        return $reply.result.result.value
      }
    }
  }
  Write-Output (Invoke-Page $suite)
  $setup = Invoke-Page 'window.__suite.setup()'
  Write-Output ("SETUP  " + $setup.detail)
  if (-not $setup.ok) { $failed++; throw 'Setup failed.' }
  foreach ($name in (Invoke-Page 'window.__suite.names')) {
    if ($Only -and $name -ne $Only) { continue }
    $started = Get-Date
    $result = Invoke-Page "window.__suite.run($(ConvertTo-Json $name))"
    $seconds = [math]::Round(((Get-Date) - $started).TotalSeconds)
    if ($result.ok) { Write-Output "PASS   $name ($($seconds)s): $($result.detail)" }
    else { $failed++; Write-Output "FAIL   $name ($($seconds)s): $($result.detail)" }
  }
} finally {
  if ($browserProcess) { Stop-Process -Id $browserProcess.Id -Force -ErrorAction SilentlyContinue }
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*digital-life-tests-$PID*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Stop-Job $server -ErrorAction SilentlyContinue; Remove-Job $server -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 500
  Remove-Item -Recurse -Force $profileDir -ErrorAction SilentlyContinue
}
if ($failed) { Write-Output "$failed check(s) failed."; exit 1 } else { Write-Output 'All checks passed.' }
