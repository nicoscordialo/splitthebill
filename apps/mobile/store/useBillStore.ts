import { create } from 'zustand'

type BillState = {
  currentBillId: string | null
  currentParticipantId: string | null
  currentParticipantColor: string
  setCurrentBill: (billId: string) => void
  setCurrentParticipant: (participantId: string, color: string) => void
}

export const useBillStore = create<BillState>((set) => ({
  currentBillId: null,
  currentParticipantId: null,
  currentParticipantColor: '#2563EB',
  setCurrentBill: (billId) => set({ currentBillId: billId }),
  setCurrentParticipant: (participantId, color) =>
    set({ currentParticipantId: participantId, currentParticipantColor: color })
}))
