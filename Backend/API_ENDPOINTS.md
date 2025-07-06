# QuickHire AI API Endpoints

## Base URL: http://localhost:5001/api

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user  
- `GET /auth/test` - Test database connection

### Interviews
- `POST /interviews` - Create interview
- `GET /interviews/company` - Get company interviews
- `GET /interviews/:id` - Get interview details
- `POST /interviews/start` - Start interview session
- `GET /interviews/:id/questions` - Get interview questions

### Candidates
- `POST /interviews/:id/upload-candidates` - Upload candidates (Excel)
- `PUT /interviews/:id/candidates/:candidateId/status` - Update candidate status
- `POST /interviews/validate-code` - Validate interview/candidate codes

### Analysis
- `POST /interviews/process-answer` - Process answer with AI
- `POST /interviews/evaluate-answer` - Evaluate answer (legacy)
- `POST /interviews/submit-all-answers` - Submit all answers at once
- `POST /interviews/analyze-face` - Analyze face data
- `POST /interviews/final-evaluation` - Generate final evaluation

### Results
- `POST /interviews/:id/candidates/:code/end` - End interview
- `GET /interviews/:id/results` - Get interview results
- `POST /interviews/submit-results` - Submit interview results

### Test
- `GET /test` - Test server
- `GET /interviews/test` - Test interview routes
- `GET /interviews/test-auth` - Test authentication 