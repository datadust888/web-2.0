const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Получение данных пользователя
router.get('/user/:telegramId', async (req, res) => {
    try {
        let user = await User.findOne({ telegramId: req.params.telegramId });
        
        if (!user) {
            // Создание нового пользователя
            user = new User({
                telegramId: req.params.telegramId,
                firstName: 'Новый игрок',
                balance: 10 // Стартовый бонус
            });
            await user.save();
        }
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Привязка кошелька TON
router.post('/connect-wallet', async (req, res) => {
    try {
        const { telegramId, walletAddress, signedMessage } = req.body;
        
        // Здесь должна быть проверка подписи через TonConnect
        // Пока сохраняем без проверки для тестирования
        
        await User.findOneAndUpdate(
            { telegramId },
            { walletAddress, walletConnected: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка привязки кошелька' });
    }
});

module.exports = router;