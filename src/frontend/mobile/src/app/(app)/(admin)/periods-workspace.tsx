import PeriodsWorkspaceScreen from '@/src/screens/admin/periods-workspace/PeriodsWorkspaceScreen';
import { OrgStructureAccessGate } from '@/src/screens/admin/components/OrgStructureAccessGate';

export default function PeriodsWorkspaceRoute() {
  return (
    <OrgStructureAccessGate>
      <PeriodsWorkspaceScreen />
    </OrgStructureAccessGate>
  );
}
