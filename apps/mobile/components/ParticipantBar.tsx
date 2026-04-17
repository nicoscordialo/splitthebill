import { ScrollView, Text, View } from 'react-native'
import { Participant } from '@splitthebill/shared'
import { formatCents } from '../lib/utils'

type ParticipantBarProps = {
  participants: Participant[]
  totalsByParticipant: Record<string, number>
  currency: string
}

export const ParticipantBar = ({ participants, totalsByParticipant, currency }: ParticipantBarProps) => (
  <View className="border-b border-slate-200 bg-white py-3">
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
      {participants.map((participant) => (
        <View key={participant.id} className="mr-4 items-center">
          <View className="mb-1 h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: participant.color }}>
            <Text className="text-sm font-semibold text-white">
              {participant.display_name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xs text-slate-600">{formatCents(totalsByParticipant[participant.id] ?? 0, currency)}</Text>
        </View>
      ))}
    </ScrollView>
  </View>
)
