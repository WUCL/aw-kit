// rpc-type-ok: 刻意窄化，只給 UI 用到的兩欄
export interface OrderRow { id: string; total: number }
export async function listOrders(sb: any): Promise<OrderRow[]> {
  const { data, error } = await sb.rpc('list_orders')
  if (error) throw error
  return data as OrderRow[]
}
