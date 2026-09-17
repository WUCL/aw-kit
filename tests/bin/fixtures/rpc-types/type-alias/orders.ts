export type OrderRow = { id: string; total: number }
export async function listOrders(sb: any) {
  const { data, error } = await sb.rpc('list_orders')
  if (error) throw error
  return data as unknown as OrderRow[]
}
