const express = require('express');
const router = express.Router();
const fs = require('fs').promises;

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const userData = await getUserData(userId);
        
        res.json({
            success: true,
            user: {
                balance: userData.balance,
                inventory: userData.inventory,
                lastFreeCase: userData.lastFreeCase
            }
        });
    } catch (error) {
        res.json({ success: false, error: 'User not found' });
    }
});

async function getUserData(userId) {
    try {
        const data = await fs.readFile(`./data/users/${userId}.json`, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { balance: 1000, inventory: [], lastFreeCase: null };
    }
}

module.exports = router;