import { useThemeColors } from '@/src/hooks/useThemeColors';
import DashboardScreen from '@/src/screens/widgets/dashboard/components/DashboardScreen'; 

export default function DashboardRoute() {
  const colors = useThemeColors();

  return <DashboardScreen />;
}