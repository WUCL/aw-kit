import type { Database } from '../types'
export type OrderRow = Database['public']['Functions']['list_orders']['Returns'][number]
export async function listOrders(sb: any): Promise<OrderRow[]> {
  const { data, error } = await sb.rpc('list_orders')
  if (error) throw error
  return data as OrderRow[]
}
