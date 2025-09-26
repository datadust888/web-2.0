const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Подключение к MongoDB
mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://localhost:27017/fiatvalue',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Маршруты
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/cases', require('./routes/cases'));
} catch (e) {
  console.error('⚠️ Ошибка подключения маршрутов:', e);
}

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Для Vercel экспортируем приложение без app.listen()
module.exports = app;

// ✅ Если запускаешь локально — включаем порт:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}