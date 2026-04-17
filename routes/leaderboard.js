const express = require('express');
const router = express.Router();
const User = require('./models/User'); // Adjust path as needed

// Get the leaderboard (top 10 users by points)
router.get('/top', async (req, res) => {
  try {
    const topUsers = await User.find().sort({ points: -1 }).limit(10);
    res.json(topUsers);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update points for a user
router.post('/update', async (req, res) => {
  try {
    const { email, points } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.points += points; // Add points to existing score
    await user.save();

    res.status(200).json({ message: 'Points updated successfully', user });
  } catch (error) {
    console.error('Error updating points:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;