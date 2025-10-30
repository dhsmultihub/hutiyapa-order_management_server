# API Testing Script for Order Management Server
# Run this after starting the server with: npm run start:dev

$baseUrl = "http://localhost:8000/api/v1"
$results = @()

Write-Host "[TEST] Starting API Tests..." -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Function to test an endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "  [OK] SUCCESS" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Depth 3 -Compress | Out-String)" -ForegroundColor Gray
        
        return @{
            Name = $Name
            Status = "[OK] PASS"
            Response = $response
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMsg = $_.Exception.Message
        Write-Host "  [X] FAILED - Status: $statusCode" -ForegroundColor Red
        Write-Host "  Error: $errorMsg" -ForegroundColor Red
        
        return @{
            Name = $Name
            Status = "[X] FAIL"
            Error = $errorMsg
            StatusCode = $statusCode
        }
    }
    Write-Host ""
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PUBLIC ENDPOINTS (No Auth Required)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test Health Endpoints
Write-Host "[HEALTH] HEALTH ENDPOINTS" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Health Check" -Url "$baseUrl/health"
$results += Test-Endpoint -Name "Readiness Check" -Url "$baseUrl/health/ready"
$results += Test-Endpoint -Name "Liveness Check" -Url "$baseUrl/health/live"

# Test Monitoring Endpoints
Write-Host ""
Write-Host "[MONITOR] MONITORING ENDPOINTS" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Prometheus Metrics" -Url "$baseUrl/monitoring/metrics"
$results += Test-Endpoint -Name "Business Metrics" -Url "$baseUrl/monitoring/business-metrics"
$results += Test-Endpoint -Name "Order Processing Health" -Url "$baseUrl/monitoring/order-processing-health"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  AUTHENTICATED ENDPOINTS (Auth Required)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test Order Endpoints (will fail without auth)
Write-Host "[ORDERS] ORDER ENDPOINTS (Require Auth)" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Get All Orders" -Url "$baseUrl/orders"
$results += Test-Endpoint -Name "Get Order by ID" -Url "$baseUrl/orders/1"
$results += Test-Endpoint -Name "Get Orders by User" -Url "$baseUrl/orders/user/1"

# Test Payment Endpoints
Write-Host ""
Write-Host "[PAYMENT] PAYMENT ENDPOINTS (Require Auth)" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Get All Payments" -Url "$baseUrl/payments"
$results += Test-Endpoint -Name "Get Payments by Order" -Url "$baseUrl/payments/order/1"

# Test Shipment Endpoints
Write-Host ""
Write-Host "[SHIPMENT] SHIPMENT ENDPOINTS (Require Auth)" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Get All Shipments" -Url "$baseUrl/shipments"
$results += Test-Endpoint -Name "Track Shipment" -Url "$baseUrl/shipments/track/BD1234567890"

# Test Analytics Endpoints
Write-Host ""
Write-Host "[ANALYTICS] ANALYTICS ENDPOINTS (Require Auth)" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Order Metrics" -Url "$baseUrl/analytics/orders/metrics"
$results += Test-Endpoint -Name "Revenue Metrics" -Url "$baseUrl/analytics/revenue/metrics"

# Test Search Endpoints
Write-Host ""
Write-Host "[SEARCH] SEARCH ENDPOINTS (Require Auth)" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Search Orders" -Url "$baseUrl/search/orders?query=john"

# Test Dashboard Endpoints
Write-Host ""
Write-Host "[DASHBOARD] DASHBOARD ENDPOINTS (Require Auth)" -ForegroundColor Magenta
$results += Test-Endpoint -Name "Dashboard Overview" -Url "$baseUrl/dashboard/overview"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passCount = ($results | Where-Object { $_.Status -eq "[OK] PASS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "[X] FAIL" }).Count
$total = $results.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

Write-Host ""
Write-Host "[RESULTS] Test Results:" -ForegroundColor Yellow
foreach ($result in $results) {
    Write-Host "  $($result.Status) $($result.Name)" -ForegroundColor $(if ($result.Status -eq "[OK] PASS") { "Green" } else { "Red" })
}

Write-Host ""
Write-Host "[NOTE] Endpoints marked as FAIL with 401 status require JWT authentication" -ForegroundColor Yellow
Write-Host "       These are working correctly but need a valid Bearer token to access" -ForegroundColor Yellow
Write-Host ""

Write-Host "[OK] API Testing Complete!" -ForegroundColor Green
Write-Host ""

