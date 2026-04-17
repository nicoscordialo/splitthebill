import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bill, Claim, Item, Participant } from '@splitthebill/shared'
import { supabase } from './supabase'

export const useBill = (roomCode: string) =>
  useQuery({
    queryKey: ['bill', roomCode],
    enabled: Boolean(roomCode),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (error) {
        throw error
      }

      return data as Bill
    }
  })

export const useItems = (billId: string) =>
  useQuery({
    queryKey: ['items', billId],
    enabled: Boolean(billId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('bill_id', billId)
        .order('position', { ascending: true })

      if (error) {
        throw error
      }

      return (data ?? []) as Item[]
    }
  })

export const useParticipants = (billId: string) =>
  useQuery({
    queryKey: ['participants', billId],
    enabled: Boolean(billId),
    queryFn: async () => {
      const { data, error } = await supabase.from('participants').select('*').eq('bill_id', billId)

      if (error) {
        throw error
      }

      return (data ?? []) as Participant[]
    }
  })

export const useClaims = (billId: string) =>
  useQuery({
    queryKey: ['claims', billId],
    enabled: Boolean(billId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('id, item_id, participant_id, shares, items!inner(bill_id)')
        .eq('items.bill_id', billId)

      if (error) {
        throw error
      }

      return (data ?? []) as Claim[]
    }
  })

export const useUpsertClaim = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Pick<Claim, 'item_id' | 'participant_id' | 'shares'>) => {
      const { data, error } = await supabase
        .from('claims')
        .upsert(payload, { onConflict: 'item_id,participant_id' })
        .select('*')
        .single()

      if (error) {
        throw error
      }

      return data as Claim
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
    }
  })
}

export const useDeleteClaim = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, participantId }: { itemId: string; participantId: string }) => {
      const { error } = await supabase
        .from('claims')
        .delete()
        .eq('item_id', itemId)
        .eq('participant_id', participantId)

      if (error) {
        throw error
      }

      return true
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] })
    }
  })
}
