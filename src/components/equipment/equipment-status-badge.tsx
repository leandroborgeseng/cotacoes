import { STATUS_LABEL, type EquipmentStatus } from "@/domain/equipment-status";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<EquipmentStatus, "secondary" | "default" | "outline" | "destructive"> = {
  rascunho: "secondary",
  pronto_para_cotacao: "default",
  enviado: "outline",
  cotado: "outline",
};

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
