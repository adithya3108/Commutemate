# MongoDB Compass Quick Reference Guide

## Connecting to MongoDB Compass

1. **Launch MongoDB Compass**
2. **Connection String**: `mongodb://localhost:27017`
3. **Database**: `commutemate`

## Collections in CommuteMate

### users
- Stores all user profiles
- Fields: name, email, vehicle info, preferences, trust score
- **Key Fields**: `_id`, `email` (unique)

### daily_optins
- Daily ride sharing opt-ins for users
- Fields: userId, date, role (SHARER/COMMUTER), status
- **Key Fields**: `_id`, unique constraint on `[userId, date]`

### matches
- Ride matches between sharer and commuters
- Fields: sharerId, date, status, participants
- **Key Fields**: `_id`, `sharerId`

### match_participants
- Participants in each match
- Fields: matchId, commuterID, pickup/drop locations, OTP
- **Key Fields**: `_id`, `matchId`, `commuterID`

### trust_signals
- Trust ratings and signals between users
- Fields: fromUserId, toUserId, matchId, wouldRideAgain, tags
- **Key Fields**: `_id`, unique constraint on `[fromUserId, matchId]`

### squads
- Recurring ride sharing groups
- Fields: name, createdById, rideDays, departureTime
- **Key Fields**: `_id`, `createdById`

### squad_members
- Members belonging to squads
- Fields: squadId, userId, role
- **Key Fields**: `_id`, unique constraint on `[squadId, userId]`

### email_verifications
- Email verification tokens
- Fields: email, token, expiresAt, used
- **Key Fields**: `_id`, `token` (unique)

## Common MongoDB Compass Operations

### Viewing Data
1. Click on database `commutemate`
2. Select a collection
3. View documents in tabular or list format
4. Use filter box to search: `{ "email": "user@example.com" }`

### Creating Documents
1. Click `ADD DATA` button in collection
2. Choose `Insert Document`
3. Manually enter or paste JSON document
4. MongoDB will auto-generate `_id` if not provided

### Updating Documents
1. Click on document row
2. Click edit icon (pencil)
3. Modify fields
4. Click `UPDATE`

### Deleting Documents
1. Click on document row
2. Click delete icon (trash)
3. Confirm deletion

### Sample Query Filters

```json
// Find user by email
{ "email": "john@example.com" }

// Find all opt-ins for a specific user
{ "userId": "ObjectId" }

// Find pending matches
{ "status": "PENDING" }

// Find trusts between two users
{ "fromUserId": "ObjectId", "toUserId": "ObjectId" }

// Find users with trust score > 50
{ "trustScore": { "$gt": 50 } }

// Find matches on specific date
{ "date": { "$gte": ISODate("2024-01-01") } }
```

## Useful MongoDB Shell Commands

Access MongoDB Shell in Compass or terminal:

```javascript
// Use database
use commutemate

// Count documents
db.users.countDocuments()

// Find all users
db.users.find()

// Find user by email
db.users.findOne({ email: "user@example.com" })

// Update user trust score
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { trustScore: 75 } }
)

// Delete user
db.users.deleteOne({ _id: ObjectId("...") })

// Create index on email
db.users.createIndex({ email: 1 })

// View collection stats
db.users.stats()

// Clear collection
db.users.deleteMany({})
```

## Data Monitoring

### View Real-time Performance
- **Performance** tab shows database operations
- **Explain Plan** shows query efficiency
- **Schema** tab shows field structure

### Create Backups
1. In Compass, right-click collection
2. Select "Export Collection"
3. Choose JSON format
4. Save locally

### Import Data
1. Click collection
2. Click **ADD DATA**
3. Choose **Import File**
4. Select JSON file to import

## Troubleshooting

### Can't Connect to MongoDB
- Ensure MongoDB service is running
- Check if localhost:27017 is accessible
- Verify no firewall blocks the connection
- Try command: `mongosh localhost:27017`

### Collection Not Showing
- MongoDB doesn't show collections until they have data
- Create first document in collection via Compass or API
- Refresh Compass

### Need to Migrate to Atlas Later
1. Export collection data from Compass
2. Create MongoDB Atlas cluster
3. Update CONNECTION STRING in `.env`
4. Restart backend server
5. Import collections to Atlas

## Tips & Best Practices

1. **Index Performance**: Add indexes on frequently queried fields
2. **Data Validation**: Prisma validates all data before insertion
3. **Backup Regularly**: Export collections weekly
4. **Monitor Size**: Check collection stats for storage usage
5. **Clean Old Data**: Implement TTL indexes for temporary data like verification tokens
