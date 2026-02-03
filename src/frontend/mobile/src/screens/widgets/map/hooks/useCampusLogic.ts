import { useRouter } from 'expo-router';

export interface Building {
  id: string;
  title: string;
  description: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export const useCampusLogic = () => {
  const router = useRouter();

  // 1. Initial Map Region (Centered roughly between Center and FSEGA)
  const initialRegion = {
    latitude: 46.7699, // Centered latitude
    longitude: 23.6062, // Centered longitude
    latitudeDelta: 0.04, // Zoom level (smaller = closer)
    longitudeDelta: 0.04,
  };

  // 2. Real Cluj-Napoca Locations
  const buildings: Building[] = [
    {
      id: 'fsega',
      title: 'FSEGA',
      description: 'Faculty of Economics (Str. Teodor Mihali)',
      coordinate: { 
        latitude: 46.7724, 
        longitude: 23.6210 
      },
    },
    {
      id: 'central',
      title: 'UBB Central Building',
      description: 'Str. Mihail Kogălniceanu 1',
      coordinate: { 
        latitude: 46.7674, 
        longitude: 23.5913 
      },
    },
  ];

  // 3. Handlers
  const handleNavigateToIndoor = (buildingId: string) => {
    router.push(`/map/floorplan/${buildingId}`);
  };

  return {
    initialRegion,
    buildings,
    handleNavigateToIndoor,
  };
};