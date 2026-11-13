param(
  [string]$ApiBaseUrl = 'http://localhost:3001',
  [string]$WebBaseUrl = '',
  [ValidateRange(1, 100)]
  [int]$Attempts = 10,
  [ValidateRange(0, 60)]
  [int]$DelaySeconds = 3,
  [string]$Email = '',
  [string]$Password = ''
)

$ErrorActionPreference = 'Stop'

if ($ApiBaseUrl -notmatch '^https?://[^/]+') {
  Write-Error "Invalid ApiBaseUrl: $ApiBaseUrl"
  exit 2
}
if ($WebBaseUrl -and $WebBaseUrl -notmatch '^https?://[^/]+') {
  Write-Error "Invalid WebBaseUrl: $WebBaseUrl"
  exit 2
}

$apiBase = $ApiBaseUrl.TrimEnd('/')
$webBase = $WebBaseUrl.TrimEnd('/')

function Invoke-SmokeStep {
  param(
    [string]$Name,
    [scriptblock]$Check
  )
  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      & $Check
      Write-Host "PASS $Name (attempt $i)"
      return
    } catch {
      Write-Host "Retry $Name ($i/$Attempts): $($_.Exception.Message)"
      if ($i -lt $Attempts -and $DelaySeconds -gt 0) {
        Start-Sleep -Seconds $DelaySeconds
      }
    }
  }
  throw "FAIL $Name after $Attempts attempts"
}

Invoke-SmokeStep -Name 'GET /health' -Check {
  $res = Invoke-RestMethod -Uri "$apiBase/health" -Method Get -TimeoutSec 15
  if ($res.status -ne 'ok' -or $res.db -ne 'up') {
    throw "Unexpected /health payload: $($res | ConvertTo-Json -Compress)"
  }
}

Invoke-SmokeStep -Name 'GET /products' -Check {
  $res = Invoke-RestMethod -Uri "$apiBase/products" -Method Get -TimeoutSec 15
  if ($null -eq $res.data) {
    throw 'Missing data array on /products response'
  }
}

Invoke-SmokeStep -Name 'GET /inventory/pricing-config' -Check {
  $res = Invoke-RestMethod -Uri "$apiBase/inventory/pricing-config" -Method Get -TimeoutSec 15
  if ($null -eq $res) {
    throw 'Empty /inventory/pricing-config response'
  }
}

if ($Email -and $Password) {
  Invoke-SmokeStep -Name 'POST /auth/login + GET /auth/me' -Check {
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "$apiBase/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody -TimeoutSec 15
    if (-not $auth.accessToken) {
      throw 'Missing accessToken from /auth/login'
    }
    $me = Invoke-RestMethod -Uri "$apiBase/auth/me" -Method Get -Headers @{ Authorization = "Bearer $($auth.accessToken)" } -TimeoutSec 15
    if (-not $me.email) {
      throw 'Missing email from /auth/me'
    }
  }
}

if ($webBase) {
  Invoke-SmokeStep -Name "GET $webBase/menu" -Check {
    $resp = Invoke-WebRequest -Uri "$webBase/menu" -Method Get -UseBasicParsing -TimeoutSec 15
    if ($resp.StatusCode -lt 200 -or $resp.StatusCode -ge 400) {
      throw "Unexpected web status code: $($resp.StatusCode)"
    }
  }
}
