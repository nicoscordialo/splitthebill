import { z } from 'zod'

export const ItemSchema = z.object({
  id: z.string().uuid(),
  bill_id: z.string().uuid(),
  position: z.number().int(),
  name: z.string(),
  quantity: z.number(),
  unit_price_cents: z.number().int(),
  total_cents: z.number().int()
})

export const BillSchema = z.object({
  id: z.string().uuid(),
  room_code: z.string(),
  currency: z.string(),
  merchant_name: z.string().nullable().optional(),
  subtotal_cents: z.number().int().nullable().optional(),
  tax_cents: z.number().int().nullable().optional(),
  tip_cents: z.number().int().nullable().optional(),
  total_cents: z.number().int().nullable().optional(),
  scanned_at: z.string().datetime().nullable().optional()
})

export const ParticipantSchema = z.object({
  id: z.string().uuid(),
  bill_id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  display_name: z.string(),
  color: z.string(),
  joined_at: z.string().datetime().nullable().optional()
})

export const ClaimSchema = z.object({
  id: z.string().uuid(),
  item_id: z.string().uuid(),
  participant_id: z.string().uuid(),
  shares: z.number()
})

export const ScanReceiptResponseSchema = z.object({
  merchant_name: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().nullable().optional(),
      unit_price_cents: z.number().int().nullable().optional(),
      total_cents: z.number().int().nullable().optional()
    })
  ),
  subtotal_cents: z.number().int().nullable().optional(),
  tax_cents: z.number().int().nullable().optional(),
  tip_cents: z.number().int().nullable().optional(),
  total_cents: z.number().int().nullable().optional()
})

export type Item = z.infer<typeof ItemSchema>
export type Bill = z.infer<typeof BillSchema>
export type Participant = z.infer<typeof ParticipantSchema>
export type Claim = z.infer<typeof ClaimSchema>
export type ScanReceiptResponse = z.infer<typeof ScanReceiptResponseSchema>
