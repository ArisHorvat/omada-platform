import { offeringsApi, unwrapOfferingsAxios } from '@/src/api/offeringsApi';
import {
  offeringPackagesApi,
  type CourseOfferingPackageDto,
  type CourseOfferingPackageItemDto,
} from '@/src/api/offeringPackagesApi';

import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';

export type CreateImportOfferingInput = {
  periodId: string;
  courseName: string;
  /** Required when creating a new package; existing packages inherit linked programs. */
  programGroupId?: string | null;
  packageMode: 'existing' | 'new';
  packageId?: string | null;
  newPackageName?: string | null;
  applyToPeriod?: boolean;
  /** Mapped event types from the import wizard — seeds package activities before scrape apply. */
  seedWeeklySessions?: OfferingWeeklySession[];
};

function mapExistingItems(items: CourseOfferingPackageItemDto[]) {
  return items.map((item, idx) => ({
    name: item.name,
    code: item.code,
    description: item.description,
    sortOrder: item.sortOrder ?? idx,
    defaultHostId: item.defaultHostId,
    programGroupIds: item.programGroupIds?.length ? item.programGroupIds : undefined,
    instructors: item.instructors?.map((i) => ({ userId: i.userId, role: i.role })),
    weeklySessions: item.weeklySessions,
  }));
}

function findOfferingIdByName(
  offerings: { id?: string; name?: string }[],
  courseName: string,
): string | null {
  const target = courseName.trim().toLowerCase();
  const hit = offerings.find((o) => (o.name ?? '').trim().toLowerCase() === target);
  return hit?.id?.trim() ?? null;
}

export async function createImportOfferingViaPackage(input: CreateImportOfferingInput): Promise<string> {
  const courseName = input.courseName.trim();
  if (!courseName) throw new Error('Course name is required.');
  if (!input.periodId) throw new Error('Reporting period is missing.');

  const programGroupId = input.programGroupId?.trim() ?? '';
  if (input.packageMode === 'new' && !programGroupId) {
    throw new Error('Select a program for the new curriculum package.');
  }

  let packageId = input.packageId?.trim() ?? '';
  let pkg: CourseOfferingPackageDto;

  if (input.packageMode === 'new') {
    const packageName = input.newPackageName?.trim();
    if (!packageName) throw new Error('Enter a name for the new curriculum package.');
    pkg = await offeringPackagesApi.create({
      name: packageName,
      programGroupIds: [programGroupId],
    });
    packageId = pkg.id;
  } else {
    if (!packageId) throw new Error('Select a curriculum package.');
    pkg = await offeringPackagesApi.getById(packageId);
  }

  const existingItems = mapExistingItems(pkg.items ?? []);
  const alreadyInPackage = existingItems.some(
    (i) => i.name.trim().toLowerCase() === courseName.toLowerCase(),
  );

  if (!alreadyInPackage) {
    const newItemProgramIds =
      input.packageMode === 'new' && programGroupId ? [programGroupId] : undefined;
    const seedSessions = input.seedWeeklySessions?.length ? input.seedWeeklySessions : undefined;

    pkg = await offeringPackagesApi.saveItems(packageId, [
      ...existingItems,
      {
        name: courseName,
        sortOrder: existingItems.length,
        programGroupIds: newItemProgramIds,
        weeklySessions: seedSessions,
      },
    ]);
  } else if (input.seedWeeklySessions?.length) {
    const idx = existingItems.findIndex((i) => i.name.trim().toLowerCase() === courseName.toLowerCase());
    if (idx >= 0 && !(existingItems[idx].weeklySessions?.length ?? 0)) {
      const updated = [...existingItems];
      updated[idx] = { ...updated[idx], weeklySessions: input.seedWeeklySessions };
      pkg = await offeringPackagesApi.saveItems(packageId, updated);
    }
  }

  if (input.applyToPeriod !== false) {
    await offeringPackagesApi.applyToPeriod(packageId, input.periodId, {
      skipExistingNames: true,
      limitToItemNames: [courseName],
      enrollLinkedPrograms: false,
    });
  }

  const offerings = await unwrapOfferingsAxios(offeringsApi.listForPeriod(input.periodId));
  const offeringId = findOfferingIdByName(offerings ?? [], courseName);
  if (!offeringId) {
    throw new Error(
      'Course was added to the package but no term offering was found. Open Offerings workspace and apply the package to this period.',
    );
  }

  return offeringId;
}
