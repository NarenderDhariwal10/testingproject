const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const JWT_SECRET = '1234';

mongoose.connect('mongodb+srv://narender10:Narender123@wfc.fl0ue.mongodb.net/', {
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error('Connection error:', err));

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  points: { type: Number, default: 0 },
  dateOfBirth: { type: String, default: null }, // Optional fields with defaults
  gender: { type: String, default: null },
  mobile: { type: String, default: null },
  address: { type: String, default: null },

});

const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Email' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/admin/update-points', async (req, res) => {
  try {
    const { email, points } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.points += points;
    await user.save();
    res.status(200).json({ message: 'Points updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find().sort({ points: -1 }).limit(10);
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = 8900;
app.listen(PORT, () => console.log('Server running on http://localhost:${PORT}'));
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"
  if (!token) {
    return res.status(401).json({ message: 'Access denied, token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info (id) to request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};
app.put('/profile/edit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from token
    const { dateOfBirth, gender, mobile, address } = req.body;

    // Update the user in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { dateOfBirth, gender, mobile, address }, // Update fields
      { new: true, runValidators: true } // Return the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});