# Election API Documentation

## New Election Management APIs

### Create New Election
**POST** `/api/elections/create`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Student Council Election 2024",
  "description": "Annual student council election",
  "post": "President, Vice President, Secretary",
  "nominationStartDate": "2024-07-01T00:00:00.000Z",
  "nominationEndDate": "2024-07-15T23:59:59.000Z",
  "campaignStartDate": "2024-07-16T00:00:00.000Z",
  "campaignEndDate": "2024-07-30T23:59:59.000Z",
  "votingDate": "2024-08-01T00:00:00.000Z",
  "resultAnnouncementDate": "2024-08-02T00:00:00.000Z",
  "type": "Student Council"
}
```

**Response:**
```json
{
  "message": "Election created successfully",
  "election": {
    "_id": "...",
    "title": "Student Council Election 2024",
    "post": "President, Vice President, Secretary",
    // ... other fields
  }
}
```

### Get All Elections
**GET** `/api/elections/all`

**Response:**
```json
[
  {
    "_id": "...",
    "title": "Student Council Election 2024",
    "post": "President, Vice President, Secretary",
    "nominationStartDate": "2024-07-01T00:00:00.000Z",
    "nominationEndDate": "2024-07-15T23:59:59.000Z",
    "campaignStartDate": "2024-07-16T00:00:00.000Z",
    "campaignEndDate": "2024-07-30T23:59:59.000Z",
    "votingDate": "2024-08-01T00:00:00.000Z",
    "resultAnnouncementDate": "2024-08-02T00:00:00.000Z",
    "active": false,
    "createdAt": "2024-06-29T..."
  }
]
```

### Get Active Election
**GET** `/api/elections/active`

### Get Election by ID
**GET** `/api/elections/:id`

### Update Election Status
**PUT** `/api/elections/:id/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "active": true
}
```

### Delete Election (Admin Only)
**DELETE** `/api/elections/:id`

**Headers:**
```
Authorization: Bearer <token>
```

## Permissions
- **Create Election**: Admin and EC Officer
- **Update Election Status**: Admin and EC Officer
- **Delete Election**: Admin only
- **View Elections**: Public access

## Election Schedule Fields
- `nominationStartDate`: When nominations begin
- `nominationEndDate`: When nominations close
- `campaignStartDate`: When campaigning begins
- `campaignEndDate`: When campaigning ends
- `votingDate`: The voting day
- `resultAnnouncementDate`: When results are announced
- `post`: The election position/post (new field)

## Candidate Application APIs

### Apply as Candidate
**POST** `/api/user/apply-candidate`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "StudentId": "ST2024001",
  "email": "john.doe@university.edu",
  "phone": "+1234567890",
  "statement": "I am passionate about representing student interests and have experience in leadership roles. I believe in transparency, accountability, and working together to improve our academic environment and campus life for all students.",
  "position": "President",
  "electionId": "60f7b1234567890abcdef123"
}
```

**Response:**
```json
{
  "message": "Candidate application submitted successfully",
  "candidate": {
    "id": "60f7b1234567890abcdef456",
    "name": "John Doe",
    "position": "President",
    "status": "pending"
  }
}
```

### Get My Candidate Applications
**GET** `/api/user/my-applications`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "_id": "60f7b1234567890abcdef456",
    "name": "John Doe",
    "StudentId": "ST2024001",
    "email": "john.doe@university.edu",
    "phone": "+1234567890",
    "statement": "I am passionate about...",
    "position": "President",
    "status": "pending",
    "electionId": {
      "title": "Student Council Election 2024",
      "post": "President, Vice President, Secretary",
      "active": true
    },
    "createdAt": "2024-06-29T...",
    "updatedAt": "2024-06-29T..."
  }
]
```

### Get Specific Candidate Application
**GET** `/api/user/application/:id`

**Headers:**
```
Authorization: Bearer <token>
```

### Update Candidate Application
**PUT** `/api/user/application/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:** (All fields are optional)
```json
{
  "name": "John Doe Updated",
  "phone": "+1234567899",
  "statement": "Updated statement with new vision and goals for the student body...",
  "position": "Vice President"
}
```

**Note:** Can only update applications with "pending" status.

### Delete Candidate Application
**DELETE** `/api/user/application/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Note:** Can only delete applications with "pending" status.

## Candidate Schema Fields

- `name`: Full name of the candidate
- `StudentId`: Unique student identifier
- `email`: Unique email address
- `phone`: Contact phone number
- `statement`: Campaign statement (50-500 characters)
- `position`: Position applying for
- `status`: Application status (pending, approved, rejected)
- `electionId`: Reference to the election
- `userId`: Reference to the user account
- `createdAt`: Application submission date
- `updatedAt`: Last modification date

## Validation Rules

1. **Required Fields**: name, StudentId, email, phone, statement, position, electionId
2. **Statement Length**: Must be between 50 and 500 characters
3. **Unique Fields**: StudentId and email must be unique across all candidates
4. **Election Status**: Can only apply to active elections
5. **One Application**: Users can only have one application per election
6. **Modification**: Can only update/delete pending applications

## Permissions
- **Apply as Candidate**: Users only
- **View Own Applications**: Users only
- **Update/Delete Applications**: Users only (own applications with pending status)

## EC Officer - Candidate Management APIs

### Update Candidate Status
**PUT** `/api/ec/candidate/:id/status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "approved",
  "reason": "Optional rejection reason (required if status is 'rejected')"
}
```

**Valid Status Values:**
- `pending`: Reset to pending status
- `approved`: Approve the candidate
- `rejected`: Reject the candidate (requires reason)

**Response:**
```json
{
  "message": "Candidate status updated to approved successfully",
  "candidate": {
    "_id": "60f7b1234567890abcdef456",
    "name": "John Doe",
    "StudentId": "ST2024001",
    "email": "john.doe@university.edu",
    "status": "approved",
    "updatedAt": "2024-06-29T...",
    "userId": {
      "name": "John Doe",
      "username": "johndoe"
    },
    "electionId": {
      "title": "Student Council Election 2024",
      "post": "President, Vice President, Secretary"
    }
  }
}
```

### Bulk Update Candidate Status
**PUT** `/api/ec/candidates/bulk-status`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "candidateIds": [
    "60f7b1234567890abcdef456",
    "60f7b1234567890abcdef789",
    "60f7b1234567890abcdef012"
  ],
  "status": "approved",
  "reason": "Optional rejection reason (required if status is 'rejected')"
}
```

**Response:**
```json
{
  "message": "3 candidates updated to approved successfully",
  "updatedCount": 3,
  "candidates": [
    {
      "_id": "60f7b1234567890abcdef456",
      "name": "John Doe",
      "status": "approved",
      // ... other fields
    }
    // ... other updated candidates
  ]
}
```

### Existing Candidate Management Endpoints

#### Get All Candidates (with status filtering)
**GET** `/api/ec/candidates`

**Response:**
```json
{
  "pending": [
    {
      "_id": "...",
      "name": "John Doe",
      "StudentId": "ST2024001",
      "status": "pending",
      "userId": { "name": "John Doe", "username": "johndoe" },
      "electionId": { "title": "Student Council Election 2024", "post": "President" }
    }
  ],
  "approved": [...],
  "rejected": [...]
}
```

#### Get Candidate Details
**GET** `/api/ec/candidate/:id`

#### Approve Candidate (Legacy)
**POST** `/api/ec/approve/:id`

#### Reject Candidate (Legacy)
**POST** `/api/ec/reject/:id`

**Body:**
```json
{
  "reason": "Does not meet eligibility requirements"
}
```

## Status Update Features

1. **Flexible Status Changes**: Can change between any valid status (pending, approved, rejected)
2. **Validation**: Ensures valid status values and required rejection reasons
3. **Bulk Operations**: Update multiple candidates at once
4. **Audit Trail**: Updates timestamp when status changes
5. **Reason Tracking**: Stores rejection reasons and clears them when status changes
6. **Population**: Returns populated user and election data
7. **Error Handling**: Comprehensive error messages and status codes

## Permissions
- **All Candidate Status Updates**: EC Officer only
- **View Candidate Details**: EC Officer only

## Live Vote Counting APIs

### Get Live Vote Count for Specific Election
**GET** `/api/vote/live-count/:electionId`

**Response:**
```json
{
  "electionId": "60f7b1234567890abcdef123",
  "electionTitle": "Student Council Election 2024",
  "electionPost": "President",
  "totalVotes": 150,
  "totalEligibleVoters": 500,
  "votePercentage": 30.00,
  "candidates": [
    {
      "candidateId": "60f7b1234567890abcdef456",
      "candidateName": "John Doe",
      "position": "President",
      "voteCount": 85
    },
    {
      "candidateId": "60f7b1234567890abcdef789",
      "candidateName": "Jane Smith",
      "position": "President",
      "voteCount": 65
    }
  ],
  "lastUpdated": "2024-06-29T..."
}
```

### Get Live Vote Count for Active Election
**GET** `/api/vote/live-count/active`

Returns the same structure as above for the currently active election.

### Get Detailed Vote Statistics
**GET** `/api/vote/statistics/:electionId`

**Response:**
```json
{
  "electionId": "60f7b1234567890abcdef123",
  "electionTitle": "Student Council Election 2024",
  "electionPost": "President",
  "totalVotes": 150,
  "totalEligibleVoters": 500,
  "turnoutPercentage": 30.00,
  "candidates": [
    {
      "candidateId": "60f7b1234567890abcdef456",
      "candidateName": "John Doe",
      "studentId": "ST2024001",
      "position": "President",
      "voteCount": 85,
      "percentage": 56.67
    }
  ],
  "winner": {
    "candidateId": "60f7b1234567890abcdef456",
    "candidateName": "John Doe",
    "voteCount": 85,
    "percentage": 56.67
  },
  "hourlyVoteDistribution": [
    {
      "_id": { "hour": 9, "date": "2024-06-29" },
      "count": 25
    }
  ],
  "generatedAt": "2024-06-29T..."
}
```

### Real-time Vote Updates (Server-Sent Events)
**GET** `/api/vote/live-updates/:electionId`

**Headers:**
```
Accept: text/event-stream
Cache-Control: no-cache
```

**Response Stream:**
```
data: {"electionId":"...","totalVotes":150,"candidates":[...],"timestamp":"2024-06-29T..."}

data: {"electionId":"...","totalVotes":151,"candidates":[...],"timestamp":"2024-06-29T..."}
```

Updates are sent every 5 seconds with current vote counts.

## Voting APIs

### Cast Vote
**POST** `/api/vote/cast`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "candidateId": "60f7b1234567890abcdef456",
  "electionId": "60f7b1234567890abcdef123"
}
```

**Response:**
```json
{
  "message": "Vote cast successfully",
  "vote": {
    "id": "60f7b1234567890abcdef999",
    "candidateId": "60f7b1234567890abcdef456",
    "electionId": "60f7b1234567890abcdef123",
    "timestamp": "2024-06-29T..."
  }
}
```

### Check Vote Status
**GET** `/api/vote/status/:electionId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (if voted):**
```json
{
  "hasVoted": true,
  "voteId": "60f7b1234567890abcdef999",
  "candidate": {
    "name": "John Doe",
    "position": "President"
  },
  "votedAt": "2024-06-29T..."
}
```

**Response (if not voted):**
```json
{
  "hasVoted": false
}
```

## Election Results APIs

### Get Election Results
**GET** `/api/vote/results/:electionId`

**Response:**
```json
{
  "electionId": "60f7b1234567890abcdef123",
  "electionTitle": "Student Council Election 2024",
  "electionPost": "President",
  "electionType": "Student Council",
  "electionDates": {
    "nominationStart": "2024-07-01T...",
    "nominationEnd": "2024-07-15T...",
    "campaignStart": "2024-07-16T...",
    "campaignEnd": "2024-07-30T...",
    "votingDate": "2024-08-01T...",
    "resultAnnouncement": "2024-08-02T..."
  },
  "totalVotes": 150,
  "totalEligibleVoters": 500,
  "turnoutPercentage": 30.00,
  "candidates": [
    {
      "candidateId": "60f7b1234567890abcdef456",
      "candidateName": "John Doe",
      "studentId": "ST2024001",
      "email": "john.doe@university.edu",
      "position": "President",
      "voteCount": 85,
      "percentage": 56.67,
      "rank": 1
    },
    {
      "candidateId": "60f7b1234567890abcdef789",
      "candidateName": "Jane Smith",
      "studentId": "ST2024002",
      "email": "jane.smith@university.edu",
      "position": "President",
      "voteCount": 65,
      "percentage": 43.33,
      "rank": 2
    }
  ],
  "winners": [
    {
      "candidateId": "60f7b1234567890abcdef456",
      "candidateName": "John Doe",
      "voteCount": 85,
      "percentage": 56.67,
      "rank": 1
    }
  ],
  "isTie": false,
  "voteDistribution": [
    {
      "_id": { "hour": 9, "date": "2024-08-01" },
      "count": 25
    }
  ],
  "resultGeneratedAt": "2024-08-02T..."
}
```

**Note:** Results are only available after the `resultAnnouncementDate` specified in the election.

### Get Active Election Results
**GET** `/api/vote/results/active`

Returns the same structure as above for the currently active election.

### Get Winner Announcement
**GET** `/api/vote/winner/:electionId`

**Response:**
```json
{
  "electionId": "60f7b1234567890abcdef123",
  "electionTitle": "Student Council Election 2024",
  "electionPost": "President",
  "totalVotes": 150,
  "winners": [
    {
      "candidateId": "60f7b1234567890abcdef456",
      "name": "John Doe",
      "studentId": "ST2024001",
      "email": "john.doe@university.edu",
      "position": "President",
      "voteCount": 85,
      "percentage": "56.67"
    }
  ],
  "isTie": false,
  "announcementDate": "2024-08-02T...",
  "generatedAt": "2024-08-02T..."
}
```

**Tie Example:**
```json
{
  "electionId": "60f7b1234567890abcdef123",
  "electionTitle": "Student Council Election 2024",
  "electionPost": "President",
  "totalVotes": 150,
  "winners": [
    {
      "candidateId": "60f7b1234567890abcdef456",
      "name": "John Doe",
      "voteCount": 75,
      "percentage": "50.00"
    },
    {
      "candidateId": "60f7b1234567890abcdef789",
      "name": "Jane Smith",
      "voteCount": 75,
      "percentage": "50.00"
    }
  ],
  "isTie": true,
  "announcementDate": "2024-08-02T...",
  "generatedAt": "2024-08-02T..."
}
```

### Get All Election Results Summary
**GET** `/api/vote/results/all`

**Response:**
```json
{
  "elections": [
    {
      "electionId": "60f7b1234567890abcdef123",
      "title": "Student Council Election 2024",
      "post": "President",
      "type": "Student Council",
      "active": false,
      "totalVotes": 150,
      "totalCandidates": 3,
      "winner": {
        "name": "John Doe",
        "position": "President",
        "voteCount": 85
      },
      "votingDate": "2024-08-01T...",
      "resultAnnouncementDate": "2024-08-02T...",
      "resultsAvailable": true
    },
    {
      "electionId": "60f7b1234567890abcdef456",
      "title": "Class Representative Election 2024",
      "post": "Class Rep",
      "type": "Class Representative",
      "active": true,
      "totalVotes": 0,
      "totalCandidates": 2,
      "winner": null,
      "votingDate": "2024-08-15T...",
      "resultAnnouncementDate": "2024-08-16T...",
      "resultsAvailable": false
    }
  ],
  "totalElections": 2,
  "activeElections": 1,
  "generatedAt": "2024-08-02T..."
}
```

## Result Features

### 🏆 **Winner Determination**
- Automatically identifies winner(s) based on highest vote count
- Handles tie situations (multiple winners with same vote count)
- Provides winner percentage and vote count

### 📊 **Comprehensive Results**
- Complete candidate rankings with vote counts and percentages
- Voter turnout statistics
- Hourly vote distribution analysis
- Election timeline information

### ⏰ **Time-based Access Control**
- Results only available after `resultAnnouncementDate`
- Returns availability time if accessed too early
- Prevents premature result disclosure

### 📈 **Analytics & Insights**
- Vote distribution by time periods
- Turnout percentage calculations
- Candidate performance rankings
- Historical election comparisons

## Result Access Examples

**Check Results Availability:**
```javascript
fetch('/api/vote/results/123')
  .then(response => {
    if (response.status === 400) {
      // Results not yet available
      return response.json().then(data => {
        console.log('Results available at:', data.availableAt);
      });
    }
    return response.json();
  })
  .then(results => {
    if (results) {
      displayResults(results);
    }
  });
```

**Winner Announcement:**
```javascript
fetch('/api/vote/winner/123')
  .then(response => response.json())
  .then(data => {
    if (data.isTie) {
      displayTieAnnouncement(data.winners);
    } else {
      displayWinnerAnnouncement(data.winners[0]);
    }
  });
```

**All Elections Summary:**
```javascript
fetch('/api/vote/results/all')
  .then(response => response.json())
  .then(data => {
    displayElectionSummary(data.elections);
    updateDashboardStats(data);
  });
```

## Error Handling

- **404**: Election not found
- **400**: Results not yet available (includes availability time)
- **500**: Server error during result calculation

## Permissions
- **View Results**: Public access (after announcement time)
- **View Winner**: Public access (after announcement time)
- **View All Results**: Public access
