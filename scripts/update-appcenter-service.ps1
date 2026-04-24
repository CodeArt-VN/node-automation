param(
	[string]$ServiceName = "appcenter-automation",
	[string]$N8nUserFolder = "C:\Users\codeart",
	[string]$CustomExtensionsPath = "C:\Users\codeart\Documents\node-automation\custom-packages\node_modules"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command nssm -ErrorAction SilentlyContinue)) {
	throw "nssm is not installed or not in PATH."
}

$serviceExists = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $serviceExists) {
	throw "Service '$ServiceName' does not exist."
}

if (-not (Test-Path $N8nUserFolder)) {
	New-Item -ItemType Directory -Path $N8nUserFolder -Force | Out-Null
}

Write-Host "Updating service '$ServiceName'..."
Write-Host "N8N_USER_FOLDER = $N8nUserFolder"
Write-Host "N8N_CUSTOM_EXTENSIONS = $CustomExtensionsPath"

nssm set $ServiceName AppEnvironmentExtra `
	"N8N_RELEASE_TYPE=dev" `
	"NODE_ENV=development" `
	"N8N_LICENSE_AUTO_RENEW_ENABLED=false" `
	"N8N_RUNNERS_ENABLED=false" `
	"N8N_PUBLIC_API_DISABLED=false" `
	"N8N_PROXY_HOPS=1" `
	"N8N_HOST=auto.appcenter.vn" `
	"N8N_EDITOR_BASE_URL=https://auto.appcenter.vn" `
	"N8N_PROTOCOL=https" `
	"N8N_PORT=5678" `
	"WEBHOOK_URL=https://auto.appcenter.vn/" `
	"N8N_USER_FOLDER=$N8nUserFolder" `
	"N8N_CUSTOM_EXTENSIONS=$CustomExtensionsPath" | Out-Null

nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null

# Disable file logging for this service (no AppStdout/AppStderr).
nssm reset $ServiceName AppStdout | Out-Null
nssm reset $ServiceName AppStderr | Out-Null
nssm reset $ServiceName AppRotateFiles | Out-Null
nssm reset $ServiceName AppRotateOnline | Out-Null

Write-Host "Restarting service..."
nssm restart $ServiceName | Out-Null
Start-Sleep -Seconds 2

$status = Get-Service -Name $ServiceName
Write-Host ""
Write-Host "Done."
Write-Host "Service status: $($status.Status)"
Write-Host "Current env:"
nssm get $ServiceName AppEnvironmentExtra

# sc.exe qc appcenter-automation; sc.exe query appcenter-automation; `
# nssm get appcenter-automation Application; `
# nssm get appcenter-automation AppParameters; `
# nssm get appcenter-automation AppDirectory; `
# nssm get appcenter-automation AppEnvironmentExtra

# nssm start appcenter-automation
# nssm stop appcenter-automation
# nssm remove <service-name> confirm
