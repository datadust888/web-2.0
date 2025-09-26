const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: {
        type: Number,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: String,
    username: String,
    photoUrl: String,
    balance: {
        type: Number,
        default: 0
    },
    walletAddress: String,
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    invitedCount: {
        type: Number,
        default: 0
    },
    earnedFromRefs: {
        type: Number,
        default: 0
    },
    lastFreeCase: Date,
    inventory: [{
        itemId: String,
        name: String,
        image: String,
        rarity: String,
        value: Number,
        acquiredAt: {
            type: Date,
            default: Date.now
        }
    }],
    openHistory: [{
        caseType: String,
        itemName: String,
        itemRarity: String,
        itemValue: Number,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Статистика по пользователю
userSchema.virtual('totalSpent').get(function() {
    return this.openHistory.reduce((total, open) => {
        const prices = { free: 0, basic: 10, premium: 50, luxury: 100 };
        return total + prices[open.caseType];
    }, 0);
});

userSchema.virtual('totalWon').get(function() {
    return this.openHistory.reduce((total, open) => total + open.itemValue, 0);
});

module.exports = mongoose.model('User', userSchema);