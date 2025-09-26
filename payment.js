const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Создание депозита
router.post('/deposit', async (req, res) => {
    try {
        const { telegramId, amount } = req.body;
        
        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        // Создание транзакции
        const transaction = new Transaction({
            userId: user._id,
            telegramId,
            type: 'deposit',
            amount,
            tonAmount: amount / 175, // Конвертация в TON
            status: 'pending',
            description: `Пополнение баланса на ${amount} звезд`
        });
        
        await transaction.save();
        
        res.json({
            success: true,
            depositId: transaction._id,
            tonAmount: transaction.tonAmount,
            merchantWallet: process.env.MERCHANT_WALLET
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка создания депозита' });
    }
});

// Проверка статуса депозита
router.get('/deposit/:depositId/status', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.depositId);
        
        if (!transaction) {
            return res.status(404).json({ error: 'Транзакция не найдена' });
        }
        
        // Здесь должна быть интеграция с TON API для проверки транзакции
        // Пока имитируем успешное пополнение через 30 секунд
        
        if (transaction.status === 'pending' && 
            Date.now() - transaction.createdAt > 30000) {
            transaction.status = 'completed';
            transaction.completedAt = new Date();
            
            // Зачисление средств пользователю
            await User.findByIdAndUpdate(transaction.userId, {
                $inc: { balance: transaction.amount }
            });
            
            await transaction.save();
        }
        
        res.json({
            status: transaction.status,
            amount: transaction.amount
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка проверки статуса' });
    }
});

module.exports = router;