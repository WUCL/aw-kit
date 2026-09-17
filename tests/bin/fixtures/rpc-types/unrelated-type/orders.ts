// 手寫型別但不是 RPC 回傳值（只當參數）→ 不算違規；且 OrderRowView 不可因前綴誤中 OrderRow
export interface OrderRow { id: string }
export async function listOrders(sb: any, filter: OrderRow) {
  const { data, error } = await sb.rpc('list_orders', filter)
  if (error) throw error
  return data as OrderRowView[]
}
