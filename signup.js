const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const app = express();
const cors=require('cors');
const leaderboardRoutes = require('./leaderboard'); // Adjust path as needed
app.use('/api/leaderboard', leaderboardRoutes);
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = '1234';

mongoose.connect('mongodb+srv://narender10:Narender123@wfc.fl0ue.mongodb.net/', {
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error('Connection error:', err));

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0, // Default starting points
  }
});

const User = mongoose.model('User', userSchema);

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

     const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (error) {
    console.error('Error registering user:', error);
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
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "An unexpected error occurred on the server." });
  });
  
const PORT = process.env.PORT || 8900;
app.listen(PORT,'0.0.0.0' ,() => {
  console.log('Server is running on http://0.0.0.0:${PORT}');
});
const shutdown = () => {
    console.log('Received shutdown signal, gracefully shutting down...');
    server.close((err) => {
      if (err) {
        console.error('Error during shutdown:', err);
        process.exit(1); 
      } else {
        console.log('Server shutdown completed');
        process.exit(0); 
      }
    });
  
    setTimeout(() => {
      console.error('Forced shutdown after 10 seconds');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGINT', shutdown); 
  process.on('SIGTERM', shutdown);