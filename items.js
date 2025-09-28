const TON_TO_STARS = 172;

const caseItems = {
    'free': {
        cost: 0,
        items: [
            { name: "+1 Star", type: "currency", image: "star1.png", rarity: "common", weight: 40, realValue: 1, displayValue: 1 },
            { name: "+3 Stars", type: "currency", image: "star3.png", rarity: "rare", weight: 20, realValue: 3, displayValue: 3 },
            { name: "+5 Stars", type: "currency", image: "star5.png", rarity: "epic", weight: 5, realValue: 5, displayValue: 5 },
            { name: "Nothing", type: "nothing", image: "nothing.png", rarity: "common", weight: 35, realValue: 0, displayValue: 0 }
        ],
        houseEdge: 0.95
    },
    '0.1': {
        cost: 17,
        items: [
            { 
                name: "Sailor Moon", 
                type: "nft", 
                image: "sailor_moon.png",
                rarity: "mythical", 
                weight: 1,
                realValue: 150 * TON_TO_STARS,
                displayValue: 150 * TON_TO_STARS
            },
            { 
                name: "Plush Pepe", 
                type: "nft", 
                image: "plush_pepe.png",
                rarity: "legendary", 
                weight: 2,
                realValue: 100 * TON_TO_STARS,
                displayValue: 100 * TON_TO_STARS
            },
            { 
                name: "Durov's Cap", 
                type: "nft", 
                image: "durov_cap.png",
                rarity: "epic", 
                weight: 5,
                realValue: 50 * TON_TO_STARS,
                displayValue: 50 * TON_TO_STARS
            },
            { 
                name: "Nothing", 
                type: "nothing", 
                image: "nothing.png", 
                rarity: "common", 
                weight: 992,
                realValue: 0, 
                displayValue: 0 
            }
        ],
        houseEdge: 0.90
    },
    '0.5': {
        cost: 86,
        items: [
            { 
                name: "0.7 TON Balance", 
                type: "currency", 
                image: "ton_coin.png", 
                rarity: "epic", 
                weight: 5,
                realValue: 0.7 * TON_TO_STARS,
                displayValue: 0.7 * TON_TO_STARS
            },
            { 
                name: "0.5 TON Balance", 
                type: "currency", 
                image: "ton_coin.png", 
                rarity: "rare", 
                weight: 10,
                realValue: 0.5 * TON_TO_STARS,
                displayValue: 0.5 * TON_TO_STARS
            },
            { 
                name: "0.3 TON Balance", 
                type: "currency", 
                image: "ton_coin.png", 
                rarity: "common", 
                weight: 85,
                realValue: 0.3 * TON_TO_STARS,
                displayValue: 0.3 * TON_TO_STARS
            },
            { 
                name: "Nothing", 
                type: "nothing", 
                image: "nothing.png", 
                rarity: "common", 
                weight: 900,
                realValue: 0, 
                displayValue: 0 
            }
        ],
        houseEdge: 0.85
    }
};

function getRandomItem(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item;
    }
    
    return items[items.length - 1];
}

module.exports = { caseItems, TON_TO_STARS, getRandomItem };