// utils/cloneEntityState.ts
import type { EntityState } from "@reduxjs/toolkit";

export function cloneEntityState<T, ID extends string | number = string>(
  es: EntityState<T, ID>
): EntityState<T, ID> {
  const newEntities = {} as Record<ID, T>;
  const newIds: ID[] = [];

  (es.ids as ID[]).forEach((id) => {
    const val = es.entities[id];
    if (val !== undefined) {
      // shallow clone the entity to avoid sharing references
      newEntities[id] = { ...(val as T) };
      newIds.push(id);
    }
  });

  return {
    ids: newIds,
    entities: newEntities,
  };
}
