import { PortalCotacao } from "@/components/fornecedor/portal-cotacao";

type Props = { params: Promise<{ token: string }> };

export default async function CotacaoPublicaPage(props: Props) {
  const { token } = await props.params;
  return <PortalCotacao token={token} />;
}
