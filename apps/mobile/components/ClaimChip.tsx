import { View } from 'react-native'

type ClaimChipProps = {
  color: string
}

export const ClaimChip = ({ color }: ClaimChipProps) => (
  <View className="mr-1 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
)
