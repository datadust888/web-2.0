const express = require('express');
const router = express.Router();
const { caseItems, TON_TO_STARS, getRandomItem } = require('../data/items');
const fs = require('fs').promises;
const path = require('path');

router.post('/open', async (req, res) => {
    try {
        const { caseType, userId } = req.body;
        
        if (!caseItems[caseType]) {
            return res.json({ success: false, error: 'Invalid case type' });
        }

        const user = await getUserData(userId);
        const caseConfig = caseItems[caseType];

        // Check balance for paid cases
        if (caseConfig.cost > 0 && user.balance < caseConfig.cost) {
            return res.json({ success: false, error: 'Insufficient balance' });
        }

        // Check free case cooldown
        if (caseType === 'free') {
            const now = Date.now();
            const lastOpen = user.lastFreeCase || 0;
            const cooldown = 24 * 60 * 60 * 1000; // 24 hours
            
            if (now - lastOpen < cooldown) {
                const remaining = cooldown - (now - lastOpen);
                return res.json({ 
                    success: false, 
                    error: Free case available in ${Math.ceil(remaining / (60 * 60 * 1000))} hours 
                });
            }
            user.lastFreeCase = now;
        }

        // Deduct cost
        if (caseConfig.cost > 0) {
            user.balance -= caseConfig.cost;
        }

        // Get random item
        const droppedItem = getRandomItem(caseConfig.items);

        // Add to inventory if it's a win
        if (droppedItem.type !== 'nothing') {
            user.inventory.push({
                ...droppedItem,
                obtainedAt: new Date().toISOString()
            });
        }

        // Update balance if item has real value
        if (droppedItem.realValue > 0) {
            user.balance += droppedItem.realValue;
        }

        await saveUserData(userId, user);

        res.json({
            success: true,
            item: {
                name: droppedItem.name,
                image: droppedItem.image,
                rarity: droppedItem.rarity,
                displayValue: droppedItem.displayValue,
                type: droppedItem.type
            },
            newBalance: user.balance
        });

    } catch (error) {
        console.error('Case opening error:', error);
        res.json({ success: false, error: 'Internal server error' });
    }
});

async function getUserData(userId) {
    try {
        const data = await fs.readFile(`./data/users/${userId}.json`, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { 
            balance: caseType === 'free' ? 0 : 1000, // Starting balance for testing
            inventory: [], 
            lastFreeCase: null,
            joinedAt: new Date().toISOString()
        };
    }
}

async function saveUserData(userId, data) {
    await fs.mkdir('./data/users', { recursive: true });
    await fs.writeFile(`./data/users/${userId}.json`, JSON.stringify(data, null, 2));
}

module.exports = router;