const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const validator = require('validator');
const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB connection
const MONGO_URI = 'mongodb+srv://narender10:Narender123@wfc.fl0ue.mongodb.net/'; // Replace with your connection string
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Database connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Password validation (8-character minimum, no other conditions)
const isValidPassword = (password) => {
  // Regex: At least one uppercase, one special character, and 9+ characters
  const passwordRegex = /^(?=.[A-Z])(?=.[@$!%?&#])[A-Za-z\d@$!%?&#]{9,}$/;
  return passwordRegex.test(password);
};


// Signup route
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Debug request data
    console.log('Request body:', req.body);

    if (!password || !isValidPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 9 characters long, with one uppercase letter and one special character',
      });
    }

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
  
// Server setup
const PORT = 2000; // Adjust as needed
app.listen(PORT, () => {
  console.log('Server running on http://localhost:',PORT);
});


