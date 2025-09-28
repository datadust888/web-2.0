class CaseAnimation {
    constructor() {
        this.animationDuration = 3000;
        this.rollInterval = 100;
    }

    async startCaseAnimation(caseType, finalItem) {
        const animationContainer = document.getElementById('case-animation-container');
        const allPossibleItems = this.getAllItemsForCase(caseType);
        
        animationContainer.innerHTML = this.getAnimationHTML();
        const slotWindow = document.getElementById('slot-items');
        
        await this.animateSlotRoll(slotWindow, allPossibleItems);
        await this.animateSlowdown(slotWindow, allPossibleItems, finalItem);
        this.highlightFinalItem();
        
        return new Promise(resolve => setTimeout(resolve, 2000));
    }

    async animateSlotRoll(slotWindow, items) {
        const startTime = Date.now();
        return new Promise(resolve => {
            const roll = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < this.animationDuration - 1000) {
                    const randomItem = items[Math.floor(Math.random() * items.length)];
                    slotWindow.innerHTML = this.createItemCard(randomItem);
                    setTimeout(roll, this.rollInterval);
                } else {
                    resolve();
                }
            };
            roll();
        });
    }

    async animateSlowdown(slotWindow, items, finalItem) {
        return new Promise(resolve => {
            let slowdownCount = 0;
            const maxSlowdownSteps = 8;
            
            const slowRoll = () => {
                if (slowdownCount < maxSlowdownSteps) {
                    const tempItems = items.filter(item => 
                        item.rarity === finalItem.rarity || Math.random() > 0.7
                    );
                    const randomItem = tempItems.length > 0 ? 
                        tempItems[Math.floor(Math.random() * tempItems.length)] : 
                        items[Math.floor(Math.random() * items.length)];
                    
                    slotWindow.innerHTML = this.createItemCard(randomItem);
                    setTimeout(slowRoll, this.rollInterval + (slowdownCount * 50));
                    slowdownCount++;
                } else {
                    slotWindow.innerHTML = this.createItemCard(finalItem);
                    resolve();
                }
            };
            slowRoll();
        });
    }

    getAllItemsForCase(caseType) {
        // This would be populated from server data
        const items = [
            { name: "Plush Pepe", image: "plush_pepe.png", rarity: "mythical", displayValue: 601828 },
            { name: "Durov's Cap", image: "durov_cap.png", rarity: "legendary", displayValue: 105436 },
            { name: "Nothing", image: "nothing.png", rarity: "common", displayValue: 0 }
        ];
        
        return items;
    }

    createItemCard(item) {
        return `
            <div class="item-card item-${item.rarity}">
                <img src="items/${item.image}" alt="${item.name}">
                <div class="item-name">${item.name}</div>
                <div class="item-value">+${item.displayValue} stars</div>
            </div>
        `;
    }

    getAnimationHTML() {
        return `
            <div class="slot-machine">
                <div class="slot-window">
                    <div id="slot-items" class="slot-items"></div>
                </div>
                <div class="slot-overlay"></div>
            </div>
        `;
    }

    highlightFinalItem() {
        const slotItems = document.getElementById('slot-items');
        gsap.to(slotItems, {
            scale: 1.1,
            duration: 0.3,
            yoyo: true,
            repeat: 2,
            ease: "power2.inOut"
        });
    }
}

// Initialize animation class
window.caseAnimation = new CaseAnimation();