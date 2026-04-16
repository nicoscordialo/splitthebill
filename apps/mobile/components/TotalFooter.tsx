import { Text, View } from 'react-native'
import { formatCents } from '../lib/utils'

type TotalFooterProps = {
  totalCents: number
  currency: string
}

export const TotalFooter = ({ totalCents, currency }: TotalFooterProps) => (
  <View className="border-t border-slate-200 bg-white px-5 py-4">
    <Text className="text-center text-lg font-semibold text-slate-900">
      Your total: {formatCents(totalCents, currency)}
    </Text>
  </View>
)
