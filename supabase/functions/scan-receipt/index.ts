import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const requestSchema = z.object({
  bill_id: z.string().uuid(),
  image_path: z.string().min(1)
})

const parsedItemSchema = z.object({
  name: z.string(),
  quantity: z.number().nullable().optional(),
  unit_price_cents: z.number().int().nullable().optional(),
  total_cents: z.number().int().nullable().optional()
})

const parsedReceiptSchema = z.object({
  merchant_name: z.string().nullable().optional(),
  currency: z.string().nullable().optional(),
  items: z.array(parsedItemSchema),
  subtotal_cents: z.number().int().nullable().optional(),
  tax_cents: z.number().int().nullable().optional(),
  tip_cents: z.number().int().nullable().optional(),
  total_cents: z.number().int().nullable().optional()
})

const responseSchema = {
  type: 'object',
  properties: {
    merchant_name: { type: 'string', nullable: true },
    currency: { type: 'string', nullable: true },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number', nullable: true },
          unit_price_cents: { type: 'integer', nullable: true },
          total_cents: { type: 'integer', nullable: true }
        },
        required: ['name']
      }
    },
    subtotal_cents: { type: 'integer', nullable: true },
    tax_cents: { type: 'integer', nullable: true },
    tip_cents: { type: 'integer', nullable: true },
    total_cents: { type: 'integer', nullable: true }
  },
  required: ['items']
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }

  return btoa(binary)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = requestSchema.parse(await req.json())

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: image, error: imageError } = await supabase.storage
      .from('receipts')
      .download(body.image_path)

    if (imageError || !image) {
      throw new Error(`Unable to download receipt image: ${imageError?.message ?? 'Unknown error'}`)
    }

    const imageBuffer = await image.arrayBuffer()
    const base64Image = arrayBufferToBase64(imageBuffer)

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: 'You are a receipt parser. Extract all line items exactly as printed. All monetary values must be integer cents. If a value is unclear, set null. Do not invent items.'
              }
            ]
          },
          contents: [
            {
              role: 'user',
              parts: [
                { text: 'Parse this receipt image and return structured JSON only.' },
                {
                  inlineData: {
                    mimeType: image.type || 'image/jpeg',
                    data: base64Image
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini request failed: ${geminiResponse.status} ${await geminiResponse.text()}`)
    }

    const geminiPayload = await geminiResponse.json()
    const text = geminiPayload?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('Gemini returned no JSON payload')
    }

    const parsedReceipt = parsedReceiptSchema.parse(JSON.parse(text))

    const { error: updateBillError } = await supabase
      .from('bills')
      .update({
        merchant_name: parsedReceipt.merchant_name ?? null,
        currency: parsedReceipt.currency ?? 'USD',
        subtotal_cents: parsedReceipt.subtotal_cents ?? null,
        tax_cents: parsedReceipt.tax_cents ?? null,
        tip_cents: parsedReceipt.tip_cents ?? null,
        total_cents: parsedReceipt.total_cents ?? null,
        raw_llm_response: parsedReceipt
      })
      .eq('id', body.bill_id)

    if (updateBillError) {
      throw new Error(`Unable to update bill: ${updateBillError.message}`)
    }

    const itemRows = parsedReceipt.items.map((item, index) => {
      const quantity = item.quantity ?? 1
      const total = item.total_cents ?? 0
      const unit = item.unit_price_cents ?? (quantity > 0 ? Math.round(total / quantity) : 0)

      return {
        bill_id: body.bill_id,
        position: index + 1,
        name: item.name,
        quantity,
        unit_price_cents: unit,
        total_cents: total
      }
    })

    if (itemRows.length > 0) {
      const { error: insertItemsError } = await supabase.from('items').insert(itemRows)

      if (insertItemsError) {
        throw new Error(`Unable to insert items: ${insertItemsError.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bill_id: body.bill_id,
        item_count: itemRows.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
