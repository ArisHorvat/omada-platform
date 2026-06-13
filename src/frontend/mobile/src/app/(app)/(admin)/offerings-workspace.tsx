import OfferingsWorkspaceScreen from '@/src/screens/admin/offerings-workspace/OfferingsWorkspaceScreen';
import { OrgStructureAccessGate } from '@/src/screens/admin/components/OrgStructureAccessGate';

export default function OfferingsWorkspaceRoute() {
  return (
    <OrgStructureAccessGate>
      <OfferingsWorkspaceScreen />
    </OrgStructureAccessGate>
  );
}
