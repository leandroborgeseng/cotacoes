import type { EquipmentStatus } from "@/domain/equipment-status";

export type EquipmentListFilters = {
  status: EquipmentStatus | "all";
  categoria: string;
  ativo: "all" | "true" | "false";
};
