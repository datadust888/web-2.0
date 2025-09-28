const express = require('express');
const cors = require('cors');
const path = require('path');
const { caseLimiter, depositLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../web')));

// Routes
app.use('/api/case', caseLimiter, require('./routes/case'));
app.use('/api/user', require('./routes/user'));
app.use('/api/deposit', depositLimiter, require('./routes/deposit'));

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;