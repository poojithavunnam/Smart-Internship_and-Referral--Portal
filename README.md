# Smart Portal - Internship & Referral Platform

A modern web application for students to discover internships, apply for positions, and request referrals.

## Features

- **Internship Discovery**: Browse internships from top companies
- **Application Tracking**: Submit applications and track status
- **Referral Requests**: Request referrals for desired positions
- **User Dashboard**: Modern interface with search and filtering
- **Authentication**: Secure user registration and login

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: JWT tokens with bcrypt password hashing

## Setup Instructions

### Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (local installation or cloud service like MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**

   **Option A: Local MongoDB**
   - Install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Start MongoDB service
   - Default connection: `mongodb://localhost:27017/smart-portal`

   **Option B: MongoDB Atlas (Cloud)**
   - Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create a cluster and get connection string
   - Update `.env` file with your connection string

4. **Configure environment variables**

   Copy `.env` file and update as needed:
   ```env
   MONGODB_URI=mongodb://localhost:27017/smart-portal
   JWT_SECRET=your-secret-key-here
   PORT=3000
   ```

5. **Seed the database with internship data**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm start
   ```

7. **Access the application**
   - Open browser to `http://localhost:3000`
   - Register a new account or login

## API Endpoints

- `GET /api/internships` - Get all internships
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/apply` - Submit internship application (authenticated)
- `GET /api/applications` - Get user's applications (authenticated)
- `POST /api/referral` - Request referral (authenticated)
- `GET /api/referrals` - Get user's referrals (authenticated)

## Database Schema

### Internship
- id: String (unique identifier)
- title: String
- company: String
- location: String
- stipend: String
- duration: String
- type: String
- skills: Array of Strings
- description: String
- image: String (URL)

### User
- name: String
- email: String (unique)
- password: String (hashed)
- createdAt: Date

### Application
- userId: String
- internshipId: String
- internshipTitle: String
- company: String
- skills: String
- coverLetter: String
- status: String (default: 'Applied')
- createdAt: Date

### Referral
- userId: String
- internshipId: String
- internshipTitle: String
- company: String
- message: String
- status: String (default: 'Pending')
- requestedAt: Date

## Development

### Project Structure
```
smart-portal/
├── controllers/          # Business logic
├── data/                # JSON data files (for seeding)
├── models/              # MongoDB schemas
├── public/              # Static frontend files
├── routes/              # API route handlers
├── .env                 # Environment variables
├── package.json
├── server.js            # Main server file
└── seed.js              # Database seeding script
```

### Available Scripts
- `npm start` - Start the production server
- `npm run seed` - Seed database with internship data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.