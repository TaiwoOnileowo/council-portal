/**
 * One-off migration: find routes where a vendor worked around the (formerly
 * missing) Stops feature by cramming a whole stop list into the route name,
 * then split that into a clean name + real route_stop rows.
 *
 * Only targets the "route name contains a bulleted stop list" pattern (the
 * mojibake bullet char left by a mis-decoded emoji). Routes that just have
 * "/" or "&" joining two place names (e.g. "CU to VGC / chevron") are
 * ambiguous — same fare could mean two stops, or one place with two names —
 * so those are only reported, never auto-changed.
 *
 * Dry-run by default. Pass --apply to actually write.
 *
 *   npx tsx scripts/migrate-route-stops.ts          # report only
 *   npx tsx scripts/migrate-route-stops.ts --apply  # write changes
 */
import "dotenv/config";
import { db } from "@/lib/db";

const APPLY = process.argv.includes("--apply");

const BULLET = /[^\x00-\x7F]+/;

function isBulletedWorkaround(name: string): boolean {
  const bulletCount = (name.match(new RegExp(BULLET, "g")) ?? []).length;
  return bulletCount >= 4 && /route/i.test(name) && /stop/i.test(name);
}

function isAmbiguousCombo(name: string): boolean {
  return /\s[/&]\s/.test(name);
}

function parseBulletedWorkaround(
  name: string,
): { cleanName: string; stops: string[] } | null {
  const firstBulletIdx = name.search(BULLET);
  if (firstBulletIdx === -1) return null;
  const cleanName = name.slice(0, firstBulletIdx).trim();

  const colonIdx = name.lastIndexOf(":");
  const listSection =
    colonIdx > firstBulletIdx ? name.slice(colonIdx + 1) : name.slice(firstBulletIdx);

  const stops = listSection
    .split(BULLET)
    .map((s) =>
      s
        .replace(/\(final stop\)/i, "")
        .replace(/kindly indicate.*$/i, "")
        .replace(/please note.*$/i, "")
        .replace(/[\s.]+$/, "")
        .trim(),
    )
    .filter((s) => s.length > 0 && s.length <= 40 && s.split(" ").length <= 6);

  if (stops.length < 2 || !cleanName) return null;
  return { cleanName, stops };
}

async function main() {
  const routes = await db.price_list_route.findMany({
    where: { stops: { none: {} } },
    select: {
      id: true,
      name: true,
      price: true,
      price_list: {
        select: { direction: true, vendor: { select: { business_name: true } } },
      },
    },
  });

  const toMigrate: { id: string; oldName: string; cleanName: string; stops: string[]; vendor: string }[] = [];
  const needsReview: { id: string; name: string; vendor: string }[] = [];

  for (const route of routes) {
    const vendor = route.price_list.vendor.business_name;
    if (isBulletedWorkaround(route.name)) {
      const parsed = parseBulletedWorkaround(route.name);
      if (parsed) {
        toMigrate.push({ id: route.id, oldName: route.name, ...parsed, vendor });
        continue;
      }
    }
    if (isAmbiguousCombo(route.name)) {
      needsReview.push({ id: route.id, name: route.name, vendor });
    }
  }

  console.log(`\n=== Auto-migratable (${toMigrate.length}) ===`);
  for (const r of toMigrate) {
    console.log(`\n[${r.vendor}] ${r.id}`);
    console.log(`  old name: ${r.oldName}`);
    console.log(`  new name: ${r.cleanName}`);
    console.log(`  stops: ${r.stops.join(" | ")}`);
  }

  console.log(`\n=== Needs manual review — ambiguous combined name (${needsReview.length}) ===`);
  for (const r of needsReview) {
    console.log(`  [${r.vendor}] ${r.id}: "${r.name}"`);
  }

  if (!APPLY) {
    console.log("\nDry run only — pass --apply to write these changes.");
    return;
  }

  for (const r of toMigrate) {
    await db.$transaction(async (tx) => {
      await tx.price_list_route.update({
        where: { id: r.id },
        data: { name: r.cleanName },
      });
      await tx.route_stop.createMany({
        data: r.stops.map((name, order) => ({ route_id: r.id, name, order })),
      });
    });
  }

  console.log(`\nApplied ${toMigrate.length} route migrations.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
