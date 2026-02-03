import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

// 1. Define Sources
// Note: If you don't have these files yet, keep them as 'null' to prevent crashes.
// When you add the files to assets/sounds/, change null to require(...)
const SOURCES = {
  click: null, // require('@/assets/sounds/click.mp3'),
  success: null, // require('@/assets/sounds/success.mp3'),
  error: null, // require('@/assets/sounds/error.mp3'),
  delete: null, // require('@/assets/sounds/delete.mp3'),
  toggle: null, // require('@/assets/sounds/switch.mp3'),
};

export const useSoundDesign = () => {
  // 2. Initialize Players (One hook per sound)
  // useAudioPlayer(null) is safe and creates an empty player
  const clickPlayer = useAudioPlayer(SOURCES.click);
  const successPlayer = useAudioPlayer(SOURCES.success);
  const errorPlayer = useAudioPlayer(SOURCES.error);
  const deletePlayer = useAudioPlayer(SOURCES.delete);
  const togglePlayer = useAudioPlayer(SOURCES.toggle);

  // 3. Play Function
  const play = (type: 'click' | 'success' | 'error' | 'delete' | 'toggle') => {
    // A. Trigger Haptics (Always works)
    switch (type) {
      case 'click':
      case 'toggle':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'delete':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }

    // B. Select Player
    let player = null;
    switch (type) {
      case 'click': player = clickPlayer; break;
      case 'success': player = successPlayer; break;
      case 'error': player = errorPlayer; break;
      case 'delete': player = deletePlayer; break;
      case 'toggle': player = togglePlayer; break;
    }

    // C. Play Sound (if loaded)
    if (player) {
      // expo-audio requires manual reset to 0 if you want to replay a finished sound
      player.seekTo(0); 
      player.play();
    }
  };

  return { play };
};