import { useRef, useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as ImageManipulator from 'expo-image-manipulator'
import { router } from 'expo-router'
import { supabase } from '../lib/supabase'
import { generateRoomCode } from '../lib/utils'

const createUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [loading, setLoading] = useState(false)
  const cameraRef = useRef<CameraView | null>(null)

  const capture = async () => {
    if (!cameraRef.current || loading) {
      return
    }

    try {
      setLoading(true)

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 })
      if (!photo?.uri) {
        throw new Error('No photo captured')
      }

      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1600 } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      )

      const billId = createUuid()
      const roomCode = generateRoomCode()
      const imagePath = `${billId}/original.jpg`

      const { error: billError } = await supabase.from('bills').insert({
        id: billId,
        room_code: roomCode,
        raw_image_path: imagePath
      })

      if (billError) {
        throw billError
      }

      const imageBlob = await (await fetch(manipulated.uri)).blob()
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(imagePath, imageBlob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { error: functionError } = await supabase.functions.invoke('scan-receipt', {
        body: {
          bill_id: billId,
          image_path: imagePath
        }
      })

      if (functionError) {
        throw functionError
      }

      router.replace(`/bill/${roomCode}`)
    } catch (error) {
      Alert.alert('Scan failed', error instanceof Error ? error.message : 'Unable to read this bill right now.')
    } finally {
      setLoading(false)
    }
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-base text-slate-600">Checking camera permission…</Text>
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="mb-4 text-center text-base text-slate-700">
          Camera access is required to scan receipts.
        </Text>
        <TouchableOpacity className="rounded-xl bg-primary px-5 py-3" onPress={() => requestPermission()}>
          <Text className="font-semibold text-white">Allow Camera</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} className="flex-1" facing="back" />
      <View className="absolute inset-x-0 bottom-12 items-center">
        <TouchableOpacity
          className="h-20 w-20 rounded-full border-4 border-white bg-white/20"
          onPress={() => {
            void capture()
          }}
        />
      </View>

      {loading ? (
        <View className="absolute inset-0 items-center justify-center bg-black/60 px-8">
          <Text className="text-center text-xl font-semibold text-white">Reading your bill…</Text>
        </View>
      ) : null}
    </View>
  )
}
