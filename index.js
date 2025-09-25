// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('main');
  const [cases, setCases] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    // Mock данные как в реальных проектах
    setUser({
      id: 1,
      name: 'Username',
      avatar: 'https://via.placeholder.com/100',
      balance: 1250,
      wallet: '0x742d...f44e',
      invited: 5,
      earned: 125
    });
    
    setCases([
      { 
        id: 1, 
        name: 'Mystery Box', 
        price: 100, 
        image: 'https://via.placeholder.com/150x150/4A90E2/FFFFFF?text=?',
        rarity: 'Common',
        items: 15
      },
      { 
        id: 2, 
        name: 'Premium Case', 
        price: 500, 
        image: 'https://via.placeholder.com/150x150/9013FE/FFFFFF?text=★',
        rarity: 'Rare',
        items: 8
      },
      { 
        id: 3, 
        name: 'Legendary Chest', 
        price: 1000, 
        image: 'https://via.placeholder.com/150x150/F5A623/FFFFFF?text=✨',
        rarity: 'Legendary',
        items: 3
      },
      { 
        id: 4, 
        name: 'Starter Pack', 
        price: 50, 
        image: 'https://via.placeholder.com/150x150/50E3C2/FFFFFF?text=🎁',
        rarity: 'Common',
        items: 25
      }
    ]);

    setLeaderboard([
      { id: 1, name: 'CryptoKing', amount: 12500, avatar: 'https://via.placeholder.com/40' },
      { id: 2, name: 'NFTHunter', amount: 9800, avatar: 'https://via.placeholder.com/40' },
      { id: 3, name: 'BlockChainPro', amount: 7650, avatar: 'https://via.placeholder.com/40' },
      { id: 4, name: 'You', amount: 1250, avatar: 'https://via.placeholder.com/40', isCurrentUser: true }
    ]);
  }, []);

  const openCase = async (caseItem) => {
    setSelectedCase(caseItem);
    setIsOpening(true);
    
    // Имитация открытия кейса с анимацией
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsOpening(false);
    // Здесь будет логика показа выигрыша
  };

  const copyReferral = () => {
    navigator.clipboard.writeText('https://t.me/fiatvalue_bot?start=ref123');
    alert('Referral link copied!');
  };

  if (isOpening) {
    return (
      <div className={styles.openingContainer}>
        <div className={styles.openingAnimation}>
          <div className={styles.spinningCase}>
            <img src={selectedCase.image} alt="Case" />
          </div>
          <h2>Opening {selectedCase.name}...</h2>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>FiatValue NFT Gifts</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      {/* Header с балансом как в @case_official_bot */}
      <header className={styles.header}>
        <div className={styles.balance}>
          <span className={styles.balanceLabel}>BALANCE</span>
          <span className={styles.balanceAmount}>{user?.balance} ₽</span>
        </div>
        <div className={styles.coinIcon}>🪙</div>
      </header>

      {/* Навигация как в @virus_play_bot */}
      <nav className={styles.nav}>
        <button 
          className={`${styles.navButton} ${activeTab === 'main' ? styles.active : ''}`}
          onClick={() => setActiveTab('main')}
        >
          🎁 Cases
        </button>
        <button 
          className={`${styles.navButton} ${activeTab === 'weekly' ? styles.active : ''}`}
          onClick={() => setActiveTab('weekly')}
        >
          📊 Weekly Top
        </button>
        <button 
          className={`${styles.navButton} ${activeTab === 'profile' ? styles.active : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
      </nav>

      <main className={styles.main}>
        {/* Главная страница с кейсами */}
        {activeTab === 'main' && (
          <div className={styles.casesSection}>
            <h2 className={styles.sectionTitle}>Available Cases</h2>
            <div className={styles.casesGrid}>
              {cases.map(caseItem => (
                <div key={caseItem.id} className={styles.caseCard}>
                  <div className={styles.caseImage}>
                    <img src={caseItem.image} alt={caseItem.name} />
                    <div className={styles.caseRarity}>{caseItem.rarity}</div>
                  </div>
                  <div className={styles.caseInfo}>
                    <h3>{caseItem.name}</h3>
                    <p>{caseItem.items} unique items</p>
                    <div className={styles.casePrice}>
                      <span>{caseItem.price} ₽</span>
                      <button 
                        className={styles.openButton}
                        onClick={() => openCase(caseItem)}
                      >
                        OPEN
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Еженедельный топ как в @GiftsBattle */}
        {activeTab === 'weekly' && (
          <div className={styles.weeklySection}>
            <h2 className={styles.sectionTitle}>Weekly Leaderboard</h2>
            <div className={styles.leaderboard}>
              {leaderboard.map((player, index) => (
                <div key={player.id} className={`${styles.leaderboardItem} ${player.isCurrentUser ? styles.currentUser : ''}`}>
                  <div className={styles.rank}>
                    #{index + 1}
                  </div>
                  <div className={styles.playerInfo}>
                    <img src={player.avatar} alt={player.name} className={styles.playerAvatar} />
                    <span className={styles.playerName}>{player.name}</span>
                  </div>
                  <div className={styles.amount}>
                    {player.amount} ₽
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.leaderboardNote}>
              Updated every Monday at 00:00 UTC
            </div>
          </div>
        )}

        {/* Профиль как в @case_official_bot */}
        {activeTab === 'profile' && user && (
          <div className={styles.profileSection}>
            <div className={styles.profileHeader}>
              <img src={user.avatar} alt="Avatar" className={styles.profileAvatar} />
              <h2>{user.name}</h2>
              <div className={styles.userId}>ID: {user.id}</div>
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.infoCard}>
                <h3>Wallet Address</h3>
                <div className={styles.walletAddress}>
                  {user.wallet}
                  <button className={styles.copyButton}>📋</button>
                </div>
              </div>

              <div className={styles.infoCard}>
                <h3>Referral Program</h3>
                <div className={styles.referralStats}>
                  <div className={styles.stat}>
                    <span>Invited</span>
                    <strong>{user.invited} friends</strong>
                  </div>
                  <div className={styles.stat}>
                    <span>Earned</span>
                    <strong>{user.earned} ₽</strong>
                  </div>
                </div>
                <p className={styles.referralText}>
                  Invite friends and get 5% from their deposits!
                </p>
                <button className={styles.referralButton} onClick={copyReferral}>
                  📤 Copy Invitation Link
                </button>
              </div>

              <div className={styles.infoCard}>
                <h3>Transaction History</h3>
                <div className={styles.emptyHistory}>
                  No transactions yet
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}