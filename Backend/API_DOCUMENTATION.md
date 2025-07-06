# QuickHire AI Backend API Documentation

## Base URL
```
http://localhost:5001/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "company@example.com",
  "password": "password123",
  "userType": "company",
  "companyName": "Tech Corp",
  "industry": "Technology",
  "companySize": "1-50"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "company@example.com",
  "password": "password123",
  "userType": "company"
}
```

#### Test Authentication
```http
GET /auth/test
```

### 2. Interview Management Endpoints

#### Create Interview
```http
POST /interviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Frontend Developer Interview",
  "description": "Interview for React developer position",
  "skills": ["JavaScript", "React", "CSS"],
  "duration": 30
}
```

#### Get Company Interviews
```http
GET /interviews/company
Authorization: Bearer <token>
```

#### Get Interview Details
```http
GET /interviews/:id
Authorization: Bearer <token>
```

### 3. Candidate Management Endpoints

#### Upload Candidates (Excel)
```http
POST /interviews/:interviewId/upload-candidates
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <excel-file>
```

#### Update Candidate Status
```http
PUT /interviews/:interviewId/candidates/:candidateId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shortlisted"
}
```

#### Validate Interview Code
```http
POST /interviews/validate-code
Content-Type: application/json

{
  "interviewCode": "INT123",
  "candidateCode": "CAN456"
}
```

### 4. Interview Session Endpoints

#### Start Interview
```http
POST /interviews/start
Content-Type: application/json

{
  "interviewCode": "INT123",
  "skills": ["JavaScript", "React", "CSS"]
}
```

#### Get Questions
```http
GET /interviews/:interviewCode/questions
```

### 5. Answer Processing Endpoints

#### Process Answer
```http
POST /interviews/process-answer
Content-Type: application/json

{
  "interviewCode": "INT123",
  "questionNumber": 1,
  "answer": "I have 3 years of experience with React...",
  "videoData": {
    "faceBox": {...},
    "frameSize": {...}
  }
}
```

#### Evaluate Answer (Legacy)
```http
POST /interviews/evaluate-answer
Content-Type: application/json

{
  "answer": "I have 3 years of experience with React...",
  "question": "Tell me about your React experience",
  "interviewCode": "INT123",
  "questionNumber": 1
}
```

#### Submit All Answers
```http
POST /interviews/submit-all-answers
Content-Type: application/json

{
  "interviewCode": "INT123",
  "answers": [
    {
      "question": "Question 1",
      "answer": "Answer 1"
    },
    {
      "question": "Question 2", 
      "answer": "Answer 2"
    }
  ]
}
```

### 6. Results and Analysis Endpoints

#### End Interview
```http
POST /interviews/:interviewId/candidates/:candidateCode/end
Content-Type: application/json

{
  "answers": [...],
  "finalEvaluation": {...}
}
```

#### Get Interview Results
```http
GET /interviews/:id/results
Authorization: Bearer <token>
```

#### Submit Interview Results
```http
POST /interviews/submit-results
Authorization: Bearer <token>
Content-Type: application/json

{
  "technicalScore": 8,
  "communicationScore": 7,
  "problemSolvingScore": 9,
  "confidenceScore": 8
}
```

#### Generate Final Evaluation
```http
POST /interviews/final-evaluation
Content-Type: application/json

{
  "answers": [
    {
      "question": "Question 1",
      "answer": "Answer 1",
      "analysis": {...}
    }
  ]
}
```

### 7. Face Analysis Endpoints

#### Analyze Face
```http
POST /interviews/analyze-face
Content-Type: application/json

{
  "faceBox": {
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 200
  },
  "frameSize": {
    "width": 640,
    "height": 480
  }
}
```

### 8. Test Endpoints

#### Test Server
```http
GET /test
```

#### Test Interview Routes
```http
GET /interviews/test
```

#### Test Authentication
```http
GET /interviews/test-auth
Authorization: Bearer <token>
```

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Data Models

### Interview
```json
{
  "_id": "interview_id",
  "title": "Interview Title",
  "description": "Interview Description",
  "skills": ["JavaScript", "React"],
  "duration": 30,
  "interviewCode": "INT123",
  "company": "company_id",
  "candidates": [...],
  "status": "draft",
  "createdAt": "2025-06-29T...",
  "updatedAt": "2025-06-29T..."
}
```

### Candidate
```json
{
  "_id": "candidate_id",
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+1234567890",
  "interviews": [...],
  "createdAt": "2025-06-29T...",
  "updatedAt": "2025-06-29T..."
}
```

### User
```json
{
  "_id": "user_id",
  "email": "company@example.com",
  "userType": "company",
  "companyName": "Tech Corp",
  "industry": "Technology",
  "companySize": "1-50",
  "createdAt": "2025-06-29T...",
  "updatedAt": "2025-06-29T..."
}
```

## Error Codes

- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Missing or invalid token)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `500` - Internal Server Error (Server error)

## Notes

1. All timestamps are in ISO 8601 format
2. File uploads use multipart/form-data
3. JWT tokens expire after 24 hours
4. Interview codes are auto-generated
5. Candidate codes are generated when candidates are uploaded
6. Face analysis requires valid face detection data
7. All AI analysis uses Google Gemini API 