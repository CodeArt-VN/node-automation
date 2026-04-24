param(
	[int]$Port = 5678
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $connections) {
	Write-Host "No TCP connection found on port $Port."
	exit 0
}

$processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }
if (-not $processIds) {
	Write-Host "No user process found on port $Port."
	exit 0
}

foreach ($processId in $processIds) {
	try {
		$process = Get-Process -Id $processId -ErrorAction Stop
		Stop-Process -Id $processId -Force -ErrorAction Stop
		Write-Host "Killed PID $processId ($($process.ProcessName)) on port $Port."
	}
	catch {
		Write-Warning "Failed to kill PID $processId on port $Port. $_"
	}
}

$listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listening) {
	Write-Warning "Port $Port is still in LISTEN state."
}
else {
	Write-Host "Port $Port has no LISTEN process now."
}
