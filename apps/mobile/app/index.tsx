import { router } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-4 text-6xl">🧾</Text>
      <Text className="text-3xl font-bold text-slate-900">Split the Bill</Text>
      <Text className="mt-2 text-base text-slate-500">Scan. Claim. Split.</Text>

      <TouchableOpacity
        className="mt-10 w-full rounded-2xl bg-primary px-6 py-5"
        onPress={() => router.push('/scan')}
      >
        <Text className="text-center text-lg font-semibold text-white">📷 Scan a Bill</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 w-full rounded-2xl border border-slate-300 bg-white px-6 py-5"
        onPress={() => router.push('/join')}
      >
        <Text className="text-center text-lg font-semibold text-slate-800">Join with Code</Text>
      </TouchableOpacity>
    </View>
  )
}
