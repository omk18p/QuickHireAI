# QuickHire AI Backend API Testing Script
# Run this script to test all endpoints

$baseUrl = "http://localhost:5001"

Write-Host "=== QuickHire AI Backend API Testing ===" -ForegroundColor Green
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Test 1: Simple server test
Write-Host "1. Testing server connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/test" -Method GET
    Write-Host "✓ Server is running" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Server test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Database connection test
Write-Host "2. Testing database connection..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/test" -Method GET
    Write-Host "✓ Database connection successful" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Database test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: User registration
Write-Host "3. Testing user registration..." -ForegroundColor Cyan
$registerBody = @{
    email = "testcompany@example.com"
    password = "password123"
    userType = "company"
    companyName = "Test Company"
    industry = "Technology"
    companySize = "1-50"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✓ User registration successful" -ForegroundColor Green
    $registerData = $response.Content | ConvertFrom-Json
    Write-Host "User ID: $($registerData.user._id)" -ForegroundColor Gray
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorContent = $reader.ReadToEnd()
    Write-Host "✗ Registration failed: $errorContent" -ForegroundColor Red
}

Write-Host ""

# Test 4: User login
Write-Host "4. Testing user login..." -ForegroundColor Cyan
$loginBody = @{
    email = "testcompany@example.com"
    password = "password123"
    userType = "company"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Login successful" -ForegroundColor Green
    $loginData = $response.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorContent = $reader.ReadToEnd()
    Write-Host "✗ Login failed: $errorContent" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 5: Interview creation
Write-Host "5. Testing interview creation..." -ForegroundColor Cyan
$interviewBody = @{
    title = "Test Interview"
    description = "A test interview for API testing"
    skills = @("JavaScript", "Python", "React")
    duration = 30
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews" -Method POST -Body $interviewBody -Headers $headers
    Write-Host "✓ Interview creation successful" -ForegroundColor Green
    $interviewData = $response.Content | ConvertFrom-Json
    $interviewId = $interviewData.interview._id
    Write-Host "Interview ID: $interviewId" -ForegroundColor Gray
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorContent = $reader.ReadToEnd()
    Write-Host "✗ Interview creation failed: $errorContent" -ForegroundColor Red
}

Write-Host ""

# Test 6: Get company interviews
Write-Host "6. Testing get company interviews..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews/company" -Method GET -Headers $headers
    Write-Host "✓ Get company interviews successful" -ForegroundColor Green
    $interviewsData = $response.Content | ConvertFrom-Json
    Write-Host "Found $($interviewsData.interviews.Count) interviews" -ForegroundColor Gray
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorContent = $reader.ReadToEnd()
    Write-Host "✗ Get interviews failed: $errorContent" -ForegroundColor Red
}

Write-Host ""

# Test 7: Authentication test
Write-Host "7. Testing authentication middleware..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/interviews/test-auth" -Method GET -Headers $headers
    Write-Host "✓ Authentication middleware working" -ForegroundColor Green
    $authData = $response.Content | ConvertFrom-Json
    Write-Host "User: $($authData.user.userType)" -ForegroundColor Gray
} catch {
    $errorResponse = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($errorResponse)
    $errorContent = $reader.ReadToEnd()
    Write-Host "✗ Authentication test failed: $errorContent" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== API Testing Complete ===" -ForegroundColor Green 