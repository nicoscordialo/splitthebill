import '../global.css'

import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const queryClient = new QueryClient()

export default function RootLayout() {
  useEffect(() => {
    const ensureSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        await supabase.auth.signInAnonymously()
      }
    }

    void ensureSession()
  }, [])

  return (
    <GestureHandlerRootView className="flex-1 bg-white">
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerTitleAlign: 'center' }}>
          <Stack.Screen name="index" options={{ title: 'Split the Bill' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan Bill' }} />
          <Stack.Screen name="join" options={{ title: 'Join Bill' }} />
          <Stack.Screen name="bill/[code]" options={{ title: 'Bill' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
