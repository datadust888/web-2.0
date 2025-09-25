// components/TelegramWebApp.js
import { useEffect } from 'react';

export const useTelegramWebApp = () => {
  useEffect(() => {
    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      
      // Расширяем на весь экран
      tg.expand();
      
      // Отключаем кнопку "Назад"
      tg.BackButton.hide();
      
      // Устанавливаем цвет тему
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
      document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#4ecdc4');
    }
  }, []);
};

export const initTelegramUser = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
      return {
        id: user.id,
        name: `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`,
        avatar: user.photo_url || 'https://via.placeholder.com/100',
        username: user.username
      };
    }
  }
  return null;
};