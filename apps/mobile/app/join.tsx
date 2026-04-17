import { useMemo, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'

const colors = ['#2563EB', '#16A34A', '#DC2626', '#D97706', '#9333EA', '#0D9488']

export default function JoinScreen() {
  const [displayName, setDisplayName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)

  const normalizedCode = useMemo(() => roomCode.toUpperCase().slice(0, 6), [roomCode])

  const joinBill = async () => {
    if (!displayName.trim() || normalizedCode.length !== 6) {
      Alert.alert('Missing info', 'Add your name and a valid 6-character room code.')
      return
    }

    try {
      setLoading(true)

      const {
        data: { user }
      } = await supabase.auth.getUser()

      const { data: bill, error: billError } = await supabase
        .from('bills')
        .select('id, room_code')
        .eq('room_code', normalizedCode)
        .single()

      if (billError || !bill) {
        throw new Error('Bill not found. Check your code and try again.')
      }

      const { error: participantError } = await supabase.from('participants').insert({
        bill_id: bill.id,
        user_id: user?.id ?? null,
        display_name: displayName.trim(),
        color: colors[Math.floor(Math.random() * colors.length)]
      })

      if (participantError) {
        throw participantError
      }

      router.replace(`/bill/${bill.room_code}`)
    } catch (error) {
      Alert.alert('Could not join bill', error instanceof Error ? error.message : 'Unexpected error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-white px-6 pt-10">
      <Text className="text-lg font-semibold text-slate-900">Join a Bill</Text>

      <Text className="mt-8 mb-2 text-sm font-medium text-slate-700">Display name</Text>
      <TextInput
        className="rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-900"
        placeholder="Your name"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <Text className="mt-5 mb-2 text-sm font-medium text-slate-700">Room code</Text>
      <TextInput
        className="rounded-xl border border-slate-300 px-4 py-3 text-base uppercase tracking-wider text-slate-900"
        placeholder="ABC123"
        value={normalizedCode}
        onChangeText={(value) => setRoomCode(value.toUpperCase())}
        autoCapitalize="characters"
        maxLength={6}
      />

      <TouchableOpacity className="mt-8 rounded-xl bg-primary px-6 py-4" onPress={() => void joinBill()} disabled={loading}>
        <Text className="text-center text-base font-semibold text-white">{loading ? 'Joining…' : 'Join Bill'}</Text>
      </TouchableOpacity>
    </View>
  )
}
