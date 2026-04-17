import { Text, View } from 'react-native'
import { Claim, Item, Participant } from '@splitthebill/shared'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { ClaimChip } from './ClaimChip'
import { formatCents } from '../lib/utils'

type ItemCardProps = {
  item: Item
  claims: Claim[]
  participantsById: Record<string, Participant>
  currentParticipantId: string | null
  currentParticipantColor: string
  currency: string
  onClaim: (itemId: string) => Promise<void>
  onUnclaim: (itemId: string) => Promise<void>
}

export const ItemCard = ({
  item,
  claims,
  participantsById,
  currentParticipantId,
  currentParticipantColor,
  currency,
  onClaim,
  onUnclaim
}: ItemCardProps) => {
  const translateX = useSharedValue(0)

  const itemClaims = claims.filter((claim) => claim.item_id === item.id)
  const isClaimedByCurrent = Boolean(
    currentParticipantId && itemClaims.some((claim) => claim.participant_id === currentParticipantId)
  )

  const triggerClaim = async () => {
    if (!currentParticipantId) return
    await onClaim(item.id)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const triggerUnclaim = async () => {
    if (!currentParticipantId) return
    await onUnclaim(item.id)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX
    })
    .onEnd(() => {
      if (translateX.value > 80) {
        runOnJS(triggerClaim)()
      }

      if (translateX.value < -80) {
        runOnJS(triggerUnclaim)()
      }

      translateX.value = withSpring(0, { damping: 18, stiffness: 220 })
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={animatedStyle}
        className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-base font-semibold text-slate-900">{item.name}</Text>
            <Text className="mt-1 text-sm text-slate-600">
              {item.quantity} × {formatCents(item.unit_price_cents, currency)}
            </Text>
          </View>
          <Text className="text-base font-semibold text-slate-900">{formatCents(item.total_cents, currency)}</Text>
        </View>

        <View className="mt-3 flex-row items-center">
          {itemClaims.map((claim) => {
            const participant = participantsById[claim.participant_id]
            if (!participant) return null
            return <ClaimChip key={claim.id} color={participant.color} />
          })}
          {itemClaims.length > 1 ? <Text className="ml-1 text-xs text-slate-500">÷ {itemClaims.length}</Text> : null}
        </View>

        {isClaimedByCurrent ? (
          <View className="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl" style={{ backgroundColor: currentParticipantColor }} />
        ) : null}
      </Animated.View>
    </GestureDetector>
  )
}
