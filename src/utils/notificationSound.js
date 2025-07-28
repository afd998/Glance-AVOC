// Notification sound utilities

// Option 1: Web Audio API generated sound (works in all browsers)
export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a pleasant notification sound (two-tone chime)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Notification sound failed:', error);
  }
};

// Option 2: Simple beep using Audio API (fallback)
export const playSimpleBeep = () => {
  try {
    const audio = new Audio();
    audio.volume = 0.3;
    
    // Create a simple beep sound using data URL
    const beepData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
    audio.src = beepData;
    audio.play().catch(e => console.error('Audio play failed:', e));
  } catch (error) {
    console.error('Simple beep failed:', error);
  }
};

// Option 3: Browser notification sound (system default)
export const playSystemNotification = () => {
  try {
    // Try to use the browser's built-in notification sound
    const audio = new Audio();
    audio.volume = 0.5;
    
    // Create a very short audio context to trigger system sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Very short, quiet sound to trigger system notification
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.error('System notification failed:', error);
  }
};

// Main function that tries different sound options
export const playNotificationAudio = () => {
  // Try Web Audio API first (most reliable)
  playNotificationSound();
  
  // Fallback: try simple beep after a short delay
  setTimeout(() => {
    if (!window.AudioContext && !window.webkitAudioContext) {
      playSimpleBeep();
    }
  }, 100);
}; 
