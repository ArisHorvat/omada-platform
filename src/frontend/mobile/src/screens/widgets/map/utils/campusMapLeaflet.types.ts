import type { BuildingDto } from '@/src/api/generatedClient';

export type CampusMapLeafletProps = {
  buildings: BuildingDto[];
  isDark: boolean;
  primaryColor: string;
  onBuildingPress: (building: BuildingDto) => void;
};
