class WebApp {
    constructor() {
        this.user = null;
        this.balance = 0;
        this.init();
    }

    init() {
        this.initTelegram();
        this.initNavigation();
        this.initModals();
        this.initCaseHandlers();
        this.loadUserData();
    }

    initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            this.user = Telegram.WebApp.initDataUnsafe?.user;
            if (this.user) {
                document.getElementById('user-avatar').src = this.user.photo_url;
                document.getElementById('user-name').textContent = this.user.first_name;
                document.getElementById('profile-avatar').src = this.user.photo_url;
                document.getElementById('profile-name').textContent = this.user.first_name;
            }
        } else {
            // Mock data for development
            this.user = { id: 1, first_name: "Test User", photo_url: "" };
        }
    }

    initNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPage = e.target.dataset.page;
                this.showPage(targetPage);
                
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    initModals() {
        // Case modal
        const caseModal = document.getElementById('case-modal');
        const depositModal = document.getElementById('deposit-modal');
        
        document.querySelectorAll('.close').forEach(close => {
            close.addEventListener('click', () => {
                caseModal.style.display = 'none';
                depositModal.style.display = 'none';
            });
        });

        document.getElementById('deposit-btn').addEventListener('click', () => {
            depositModal.style.display = 'block';
        });

        window.addEventListener('click', (e) => {
            if (e.target === caseModal) caseModal.style.display = 'none';
            if (e.target === depositModal) depositModal.style.display = 'none';
        });
    }

    initCaseHandlers() {
        document.querySelectorAll('.case').forEach(caseElement => {
            caseElement.addEventListener('click', (e) => {
                const caseType = e.currentTarget.dataset.type;
                this.openCaseModal(caseType);
            });
        });

        document.getElementById('open-case-btn').addEventListener('click', () => {
            this.openCase(this.currentCaseType);
        });
    }

    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
    }

    openCaseModal(caseType) {
        this.currentCaseType = caseType;
        document.getElementById('case-modal').style.display = 'block';
        
        // Reset animation container
        document.getElementById('case-animation-container').innerHTML = `
            <div class="case-preview">
                <img src="items/${caseType}_case.png" alt="${caseType} Case">
                <h3>${caseType} TON Case</h3>
                <p>Click Open to see what's inside!</p>
            </div>
        `;
    }

    async openCase(caseType) {
        try {
            const response = await fetch('/api/case/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    caseType, 
                    userId: this.user.id 
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Start animation
                if (window.caseAnimation) {
                    await window.caseAnimation.startCaseAnimation(caseType, result.item);
                }
                
                // Update balance
                this.updateBalance(result.newBalance);
                
                // Add to live drop
                this.addToLiveDrop(result.item);
                
                // Update inventory
                this.updateInventory();
                
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Case opening failed:', error);
            alert('Network error. Please try again.');
        }
    }

    updateBalance(newBalance) {
        this.balance = newBalance;
        document.getElementById('user-balance').textContent = newBalance.toFixed(2);
        document.getElementById('profile-balance').textContent = newBalance.toFixed(2);
    }

    addToLiveDrop(item) {
        const liveDropList = document.getElementById('live-drop-list');
        const dropElement = document.createElement('div');
        dropElement.className = 'live-drop-item';
        dropElement.innerHTML = `
            <img src="items/${item.image}" alt="${item.name}" class="item-${item.rarity}">
            <span>${item.name}</span>
        `;
        liveDropList.prepend(dropElement);

        // Keep only last 15 drops
        if (liveDropList.children.length > 15) {
            liveDropList.removeChild(liveDropList.lastChild);
        }
    }

    async loadUserData() {
        try {
            const response = await fetch(`/api/user/${this.user.id}`);
            const userData = await response.json();
            
            if (userData.success) {
                this.updateBalance(userData.balance);
                this.updateInventory(userData.inventory);
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    updateInventory(inventory = []) {
        const inventoryList = document.getElementById('inventory-list');
        inventoryList.innerHTML = inventory.map(item => `
            <div class="inventory-item item-${item.rarity}">
                <img src="items/${item.image}" alt="${item.name}">
                <div>${item.name}</div>
            </div>
        `).join('');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.webApp = new WebApp();
});

// Utility function for referral link
function copyRefLink() {
    const refInput = document.getElementById('ref-link');
    refInput.select();
    document.execCommand('copy');
    alert('Referral link copied!');
}