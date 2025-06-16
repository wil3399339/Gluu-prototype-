const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const faker = require('faker');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
const SECRET = 'gluu_secret_key';

app.use(cors());
app.use(bodyParser.json());

// Database Connection
mongoose.connect('mongodb://localhost/gluu_advanced', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  coins: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  lastCoinTime: { type: Date, default: Date.now },
  lastFollowerTime: { type: Date, default: Date.now },
  botFollowsEnabled: { type: Boolean, default: true }
});

// Video Schema
const videoSchema = new mongoose.Schema({
  uploader: String,
  uploaderProfile: Object,
  url: String,
  description: String,
  isBot: Boolean,
  createdAt: { type: Date, default: Date.now }
});

// Message Schema
const messageSchema = new mongoose.Schema({
  senderId: String,
  receiverId: String,
  content: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const Message = mongoose.model('Message', messageSchema);

// JWT Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send('Unauthorized');
  try {
    const decoded = jwt.verify(token.split(' ')[1], SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send('Invalid token');
  }
};

// Register
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const user = new User({ username, email, password });
  await user.save();
  const token = jwt.sign({ id: user._id }, SECRET);
  res.json({ token, user });
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (!user) return res.status(401).send('Invalid credentials');
  const token = jwt.sign({ id: user._id }, SECRET);
  res.json({ token, user });
});

// Coin & Follower Heartbeat
app.post('/api/heartbeat', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  const now = new Date();
  const minsCoins = Math.floor((now - user.lastCoinTime) / 60000);
  const minsFollowers = Math.floor((now - user.lastFollowerTime) / 60000);
  if (minsCoins > 0) {
    user.coins += 100 * minsCoins;
    user.lastCoinTime = now;
  }
  if (minsFollowers > 0 && user.botFollowsEnabled) {
    user.followers += 100 * minsFollowers;
    user.lastFollowerTime = now;
  }
  await user.save();
  res.json({ coins: user.coins, followers: user.followers });
});

// Get Videos
app.get('/api/videos', authMiddleware, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const videos = await Video.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  res.json(videos);
});

// Post Bot Video
app.post('/api/bots/post', async (req, res) => {
  const gender = Math.random() > 0.5 ? 'men' : 'women';
  const id = Math.floor(Math.random() * 100);
  const profile = {
    name: faker.name.findName(),
    username: faker.internet.userName(),
    bio: faker.lorem.sentence(),
    profilePic: `https://randomuser.me/api/portraits/${gender}/${id}.jpg`,
    country: faker.address.country()
  };

  const video = new Video({
    uploader: profile.username,
    uploaderProfile: profile,
    url: `https://random.video/${Math.floor(Math.random() * 9999)}`,
    description: faker.lorem.sentence(),
    isBot: true
  });

  await video.save();
  res.json({ success: true, video });
});

// Send Message
app.post('/api/messages/send', authMiddleware, async (req, res) => {
  const { receiverId, content } = req.body;
  const message = new Message({ senderId: req.user.id, receiverId, content });
  await message.save();
  res.json(message);
});

// Get Messages
app.get('/api/messages/:user2', authMiddleware, async (req, res) => {
  const user1 = req.user.id;
  const { user2 } = req.params;
  const messages = await Message.find({
    $or: [
      { senderId: user1, receiverId: user2 },
      { senderId: user2, receiverId: user1 }
    ]
  }).sort({ timestamp: 1 });
  res.json(messages);
});

// Toggle Bot Followers
app.post('/api/settings/botfollows', authMiddleware, async (req, res) => {
  const { enabled } = req.body;
  const user = await User.findById(req.user.id);
  user.botFollowsEnabled = enabled;
  await user.save();
  res.json({ success: true });
});

// Start Server
app.listen(5000, () => console.log('🔥 Gluu backend running at http://localhost:5000'));
