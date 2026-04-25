import { ResumoCotacaoFornecedor } from "@/components/fornecedor/resumo-cotacao-fornecedor";

type Props = { params: Promise<{ token: string }> };

export default async function MinhaCotacaoPage(props: Props) {
  const { token } = await props.params;
  return <ResumoCotacaoFornecedor token={token} />;
}
