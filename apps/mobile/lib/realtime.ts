import { useEffect } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

export const useRealtimeSubscription = (billId: string | undefined, queryClient: QueryClient): void => {
  useEffect(() => {
    if (!billId) {
      return
    }

    const channel = supabase
      .channel(`bill-${billId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claims' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['claims', billId] })
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `bill_id=eq.${billId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: ['participants', billId] })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [billId, queryClient])
}
