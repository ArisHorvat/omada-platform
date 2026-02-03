import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

type RoomStatus = 'Occupied' | 'Free';

export const useIndoorLogic = () => {
  const { buildingId } = useLocalSearchParams();
  const [currentFloor, setCurrentFloor] = useState(1); // Default to Floor 1

  // Mock Data: Nested by Floor Level
  const floorData: any = {
    1: {
      rooms: {
        '101': { status: 'Free', color: '#22c55e' },
        '102': { status: 'Occupied', color: '#ef4444' }
      }
    },
    2: {
      rooms: {
        '201': { status: 'Free', color: '#22c55e' },
        '204': { status: 'Occupied', color: '#ef4444' }
      }
    },
    3: {
      rooms: {
        '301': { status: 'Occupied', color: '#ef4444' },
        '302': { status: 'Free', color: '#22c55e' }
      }
    }
  };

  const handleRoomPress = (roomNumber: string) => {
    const floor = floorData[currentFloor];
    const room = floor?.rooms[roomNumber];
    
    if (room) {
      Alert.alert(`Room ${roomNumber}`, `Status: ${room.status}`);
    } else {
      Alert.alert(`Room ${roomNumber}`, 'No data available');
    }
  };

  // Helper to get color safely
  const getRoomColor = (roomNumber: string) => {
    return floorData[currentFloor]?.rooms[roomNumber]?.color || '#cccccc';
  };

  return {
    buildingId,
    currentFloor,
    setCurrentFloor,
    handleRoomPress,
    getRoomColor
  };
};