import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { Claim, Item, Participant } from '@splitthebill/shared'
import { ItemCard } from '../../components/ItemCard'
import { ParticipantBar } from '../../components/ParticipantBar'
import { TotalFooter } from '../../components/TotalFooter'
import { useBill, useClaims, useDeleteClaim, useItems, useParticipants, useUpsertClaim } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { proportionalShare } from '../../lib/utils'
import { useRealtimeSubscription } from '../../lib/realtime'
import { useBillStore } from '../../store/useBillStore'

const participantColors = ['#2563EB', '#16A34A', '#DC2626', '#D97706', '#9333EA', '#0D9488']

export default function BillScreen() {
  const params = useLocalSearchParams<{ code: string }>()
  const roomCode = (params.code ?? '').toUpperCase()
  const queryClient = useQueryClient()
  const [namePrompt, setNamePrompt] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)

  const { data: bill, isLoading: billLoading } = useBill(roomCode)
  const billId = bill?.id ?? ''

  const { data: items = [], isLoading: itemsLoading } = useItems(billId)
  const { data: participants = [], isLoading: participantsLoading } = useParticipants(billId)
  const { data: claims = [], isLoading: claimsLoading } = useClaims(billId)

  const upsertClaim = useUpsertClaim()
  const deleteClaim = useDeleteClaim()

  const { currentParticipantId, currentParticipantColor, setCurrentBill, setCurrentParticipant } = useBillStore()

  useRealtimeSubscription(bill?.id, queryClient)

  useEffect(() => {
    if (bill?.id) {
      setCurrentBill(bill.id)
    }
  }, [bill?.id, setCurrentBill])

  useEffect(() => {
    const syncParticipant = async () => {
      if (!bill?.id || participants.length === 0) {
        return
      }

      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user?.id) {
        return
      }

      const existing = participants.find((participant) => participant.user_id === user.id)
      if (existing) {
        setCurrentParticipant(existing.id, existing.color)
        setShowNameModal(false)
      } else {
        setShowNameModal(true)
      }
    }

    void syncParticipant()
  }, [bill?.id, participants, setCurrentParticipant])

  const participantsById = useMemo(
    () => participants.reduce<Record<string, Participant>>((acc, participant) => ({ ...acc, [participant.id]: participant }), {}),
    [participants]
  )

  const itemsById = useMemo(
    () => items.reduce<Record<string, Item>>((acc, item) => ({ ...acc, [item.id]: item }), {}),
    [items]
  )

  const subtotalByParticipant = useMemo(() => {
    const totals: Record<string, number> = {}

    claims.forEach((claim: Claim) => {
      const item = itemsById[claim.item_id]
      if (!item) return

      const claimGroup = claims.filter((candidate) => candidate.item_id === claim.item_id)
      const totalShares = claimGroup.reduce((sum, candidate) => sum + Number(candidate.shares || 0), 0) || 1
      const itemPortion = Math.round((item.total_cents * Number(claim.shares || 0)) / totalShares)

      totals[claim.participant_id] = (totals[claim.participant_id] ?? 0) + itemPortion
    })

    return totals
  }, [claims, itemsById])

  const mySubtotal = currentParticipantId ? subtotalByParticipant[currentParticipantId] ?? 0 : 0
  const myTotal = proportionalShare(
    mySubtotal,
    bill?.subtotal_cents ?? 0,
    bill?.tax_cents ?? 0,
    bill?.tip_cents ?? 0
  )

  const onClaim = async (itemId: string) => {
    if (!currentParticipantId) return
    await upsertClaim.mutateAsync({ item_id: itemId, participant_id: currentParticipantId, shares: 1 })
  }

  const onUnclaim = async (itemId: string) => {
    if (!currentParticipantId) return
    await deleteClaim.mutateAsync({ itemId, participantId: currentParticipantId })
  }

  const createParticipant = async () => {
    const displayName = namePrompt.trim()
    if (!bill?.id || !displayName) return

    const {
      data: { user }
    } = await supabase.auth.getUser()

    const color = participantColors[Math.floor(Math.random() * participantColors.length)]
    const { data, error } = await supabase
      .from('participants')
      .insert({
        bill_id: bill.id,
        user_id: user?.id ?? null,
        display_name: displayName,
        color
      })
      .select('*')
      .single()

    if (!error && data) {
      setCurrentParticipant(data.id, data.color)
      setShowNameModal(false)
      setNamePrompt('')
    }
  }

  if (billLoading || itemsLoading || participantsLoading || claimsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-slate-50">
      <ParticipantBar
        participants={participants}
        totalsByParticipant={subtotalByParticipant}
        currency={bill?.currency ?? 'USD'}
      />

      <FlatList
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120 }}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            claims={claims}
            participantsById={participantsById}
            currentParticipantId={currentParticipantId}
            currentParticipantColor={currentParticipantColor}
            currency={bill?.currency ?? 'USD'}
            onClaim={onClaim}
            onUnclaim={onUnclaim}
          />
        )}
        ListHeaderComponent={
          <View className="mb-4">
            <Text className="text-2xl font-bold text-slate-900">{bill?.merchant_name || 'Your Bill'}</Text>
            <Text className="mt-1 text-sm text-slate-500">
              {bill?.scanned_at ? new Date(bill.scanned_at).toLocaleString() : ''}
            </Text>
          </View>
        }
      />

      <View className="absolute inset-x-0 bottom-0">
        <TotalFooter totalCents={myTotal} currency={bill?.currency ?? 'USD'} />
      </View>

      <Modal transparent animationType="slide" visible={showNameModal && !currentParticipantId}>
        <View className="flex-1 justify-end bg-black/30 p-4">
          <View className="rounded-2xl bg-white p-5">
            <Text className="text-lg font-semibold text-slate-900">Join this bill</Text>
            <Text className="mt-1 text-sm text-slate-500">Enter your display name to claim items.</Text>
            <TextInput
              className="mt-4 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900"
              placeholder="Display name"
              value={namePrompt}
              onChangeText={setNamePrompt}
            />
            <TouchableOpacity className="mt-4 rounded-xl bg-primary px-5 py-3" onPress={() => void createParticipant()}>
              <Text className="text-center font-semibold text-white">Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}
