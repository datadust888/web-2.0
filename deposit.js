const express = require('express');
const router = express.Router();
const { TON_TO_STARS } = require('../data/items');

const DEPOSIT_WALLET = 'UQBS63jy5nIpQTm0d9IOHz3Po3y4lAmGA0zmlQDab5hFk5qv';
const MIN_DEPOSIT_TON = 1;

router.post('/init', async (req, res) => {
    try {
        const { userId, depositAmountTON } = req.body;

        if (depositAmountTON < MIN_DEPOSIT_TON) {
            return res.json({
                success: false,
                error: Minimum deposit is ${MIN_DEPOSIT_TON} TON
            });
        }

        const depositAmountStars = depositAmountTON * TON_TO_STARS;
        const amountInNano = depositAmountTON * 1000000000;
        
        const paymentLink = ton://transfer/${DEPOSIT_WALLET}?amount=${amountInNano}&text=Deposit for user ${userId};

        res.json({
            success: true,
            depositWallet: DEPOSIT_WALLET,
            amountTON: depositAmountTON,
            amountStars: depositAmountStars,
            paymentLink: paymentLink,
            memo: Deposit for user ${userId}
        });

    } catch (error) {
        console.error('Deposit error:', error);
        res.json({ success: false, error: 'Payment initialization failed' });
    }
});

module.exports = router;