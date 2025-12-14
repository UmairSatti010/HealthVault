// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');

dotenv.config();
connectDB();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// static uploads - serve uploaded files
app.use('/uploads/records', express.static(path.join(__dirname, 'uploads', 'records')));
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads', 'profile')));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/records', require('./routes/records'));

// basic root
app.get('/', (req, res) => res.send('HealthVault API running'));

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
