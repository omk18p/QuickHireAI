# QuickHire AI Backend Endpoint Testing Script
# Tests all endpoints systematically

$baseUrl = "http://localhost:5001"
$testResults = @()

Write-Host "=== QuickHire AI Backend Endpoint Testing ===" -ForegroundColor Green
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Function to log test results
function Log-TestResult {
    param($TestName, $Success, $Message, $Details = "")
    $result = @{
        Test = $TestName
        Success = $Success
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
    $testResults += $result
    
    if ($Success) {
        Write-Host "✓ $TestName" -ForegroundColor Green
        if ($Message) { Write-Host "  $Message" -ForegroundColor Gray }
    } else {
        Write-Host "✗ $TestName" -ForegroundColor Red
        if ($Message) { Write-Host "  $Message" -ForegroundColor Red }
        if ($Details) { Write-Host "  Details: $Details" -ForegroundColor DarkRed }
    }
}

# Test 1: Server connectivity
Write-Host "1. Testing server connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/test" -Method GET
    Log-TestResult "Server Connectivity" $true "Server is running on port 5001"
} catch {
    Log-TestResult "Server Connectivity" $false "Server not responding" $_.Exception.Message
    Write-Host "Cannot continue testing without server connection." -ForegroundColor Red
    exit 1
}

# Test 2: Database connection
Write-Host "`n2. Testing database connection..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/test" -Method GET
    $data = $response.Content | ConvertFrom-Json
    if ($data.status -eq "online") {
        Log-TestResult "Database Connection" $true "MongoDB connected successfully"
    } else {
        Log-TestResult "Database Connection" $false "Database offline" $data.message
    }
} catch {
    Log-TestResult "Database Connection" $false "Database connection failed" $_.Exception.Message
}

# Test 3: Interview routes
Write-Host "`n3. Testing interview routes..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews/test" -Method GET
    Log-TestResult "Interview Routes" $true "Interview routes working"
} catch {
    Log-TestResult "Interview Routes" $false "Interview routes failed" $_.Exception.Message
}

# Test 4: Authentication endpoints (without database dependency)
Write-Host "`n4. Testing authentication endpoints..." -ForegroundColor Cyan

# Test 4a: Registration endpoint structure
try {
    $registerBody = @{
        email = "test@example.com"
        password = "password123"
        userType = "company"
        companyName = "Test Company"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    Log-TestResult "Registration Endpoint" $true "Registration endpoint responding"
} catch {
    if ($_.Exception.Response.StatusCode -eq 503) {
        Log-TestResult "Registration Endpoint" $false "Database required for registration" "Expected behavior when DB is offline"
    } else {
        Log-TestResult "Registration Endpoint" $false "Registration endpoint error" $_.Exception.Message
    }
}

# Test 4b: Login endpoint structure
try {
    $loginBody = @{
        email = "test@example.com"
        password = "password123"
        userType = "company"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    Log-TestResult "Login Endpoint" $true "Login endpoint responding"
} catch {
    if ($_.Exception.Response.StatusCode -eq 503) {
        Log-TestResult "Login Endpoint" $false "Database required for login" "Expected behavior when DB is offline"
    } else {
        Log-TestResult "Login Endpoint" $false "Login endpoint error" $_.Exception.Message
    }
}

# Test 5: Interview endpoints (without database dependency)
Write-Host "`n5. Testing interview endpoints..." -ForegroundColor Cyan

# Test 5a: Start interview endpoint
try {
    $startBody = @{
        interviewCode = "TEST123"
        skills = @("JavaScript", "React")
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews/start" -Method POST -Body $startBody -ContentType "application/json" -ErrorAction Stop
    Log-TestResult "Start Interview" $true "Start interview endpoint working"
} catch {
    Log-TestResult "Start Interview" $false "Start interview endpoint error" $_.Exception.Message
}

# Test 5b: Process answer endpoint
try {
    $answerBody = @{
        interviewCode = "TEST123"
        questionNumber = 1
        answer = "I have experience with JavaScript and React"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews/process-answer" -Method POST -Body $answerBody -ContentType "application/json" -ErrorAction Stop
    Log-TestResult "Process Answer" $true "Process answer endpoint working"
} catch {
    Log-TestResult "Process Answer" $false "Process answer endpoint error" $_.Exception.Message
}

# Test 5c: Validate interview code endpoint
try {
    $validateBody = @{
        interviewCode = "TEST123"
        candidateCode = "CAN456"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews/validate-code" -Method POST -Body $validateBody -ContentType "application/json" -ErrorAction Stop
    Log-TestResult "Validate Code" $true "Validate code endpoint working"
} catch {
    Log-TestResult "Validate Code" $false "Validate code endpoint error" $_.Exception.Message
}

# Test 6: Face analysis endpoint
Write-Host "`n6. Testing face analysis endpoint..." -ForegroundColor Cyan
try {
    $faceBody = @{
        faceBox = @{
            x = 100
            y = 100
            width = 200
            height = 200
        }
        frameSize = @{
            width = 640
            height = 480
        }
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews/analyze-face" -Method POST -Body $faceBody -ContentType "application/json" -ErrorAction Stop
    Log-TestResult "Face Analysis" $true "Face analysis endpoint working"
} catch {
    Log-TestResult "Face Analysis" $false "Face analysis endpoint error" $_.Exception.Message
}

# Test 7: CORS and headers
Write-Host "`n7. Testing CORS and headers..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/test" -Method GET
    $corsHeader = $response.Headers["Access-Control-Allow-Credentials"]
    if ($corsHeader -eq "true") {
        Log-TestResult "CORS Configuration" $true "CORS properly configured"
    } else {
        Log-TestResult "CORS Configuration" $false "CORS not properly configured"
    }
} catch {
    Log-TestResult "CORS Configuration" $false "CORS test failed" $_.Exception.Message
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Green
$passedTests = ($testResults | Where-Object { $_.Success }).Count
$totalTests = $testResults.Count
$successRate = [math]::Round(($passedTests / $totalTests) * 100, 1)

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $($totalTests - $passedTests)" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

# Detailed results
Write-Host "`n=== Detailed Results ===" -ForegroundColor Cyan
$testResults | ForEach-Object {
    $status = if ($_.Success) { "✓" } else { "✗" }
    $color = if ($_.Success) { "Green" } else { "Red" }
    Write-Host "$status $($_.Test)" -ForegroundColor $color
    if ($_.Message) {
        Write-Host "  $($_.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Green 