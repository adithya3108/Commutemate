# MongoDB Setup Guide for CommuteMate

## Migration from PostgreSQL to MongoDB

This project has been migrated from PostgreSQL to MongoDB for local development with MongoDB Compass.

### Prerequisites

1. **MongoDB Community Edition** - Download and install from [mongodb.com](https://www.mongodb.com/try/download/community)
2. **MongoDB Compass** - Download from [mongodb.com/products/compass](https://www.mongodb.com/products/compass)

### Installation Steps (Windows)

#### 1. Install MongoDB Community Edition

- Download the MSI installer from MongoDB's website
- Run the installer and follow the setup wizard
- Choose "Install MongoDB as a Service" (recommended)
- MongoDB will run on `localhost:27017` by default

#### 2. Verify MongoDB Installation

Open PowerShell and run:
```powershell
mongosh
```

You should see the MongoDB shell prompt. Type `exit` to quit.

#### 3. Install MongoDB Compass

- Download MongoDB Compass from the official website
- Run the installer
- Launch Compass after installation

### Configure the Backend

#### 1. Create `.env` file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Verify the DATABASE_URL in `.env`:
```
DATABASE_URL=mongodb://localhost:27017/commutemate
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

#### 4. Seed the Database (Optional)

If you have seed data:
```bash
npm run prisma:seed
```

### Running the Application

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Using MongoDB Compass

1. **Launch MongoDB Compass**
2. **Connect to Local MongoDB**
   - Connection String: `mongodb://localhost:27017`
   - Click "Connect"

3. **View Your Data**
   - Navigate to `commutemate` database
   - All collections are listed:
     - `users`
     - `daily_optins`
     - `matches`
     - `match_participants`
     - `trust_signals`
     - `squads`
     - `squad_members`
     - `email_verifications`

### Troubleshooting

#### MongoDB Service Not Running

If Compass can't connect, ensure MongoDB is running:

**Windows Services Method:**
1. Open Services (services.msc)
2. Find "MongoDB" service
3. Click "Start" if it's not running

**Command Line Method:**
```powershell
# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB
```

#### Port Already in Use

If port 27017 is in use, you can specify a different port:

1. Edit MongoDB config file or connection string
2. Update `.env`:
   ```
   DATABASE_URL=mongodb://localhost:27018/commutemate
   ```

### Future: MongoDB Atlas Migration

When ready to move to production with MongoDB Atlas:

1. Create a cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `.env`:
   ```
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/commutemate?retryWrites=true&w=majority
   ```
4. Restart the application

### Useful Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Start dev server with watch mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Models

All data is stored in MongoDB collections with the following structure:
- **users**: User accounts, vehicle info, preferences
- **daily_optins**: Daily ride sharing opt-ins
- **matches**: Ride matches between users
- **match_participants**: Participants in each match
- **trust_signals**: Trust ratings between users
- **squads**: Recurring ride sharing groups
- **squad_members**: Members of squads
- **email_verifications**: Email verification tokens

### Notes

- Prisma ORM manages all MongoDB operations
- No migrations needed - Prisma handles schema
- All data persistence is automatic
- Local Compass provides GUI for data inspection
