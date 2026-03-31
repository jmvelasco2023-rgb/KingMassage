import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

interface BookingData {
  bookingId: string
  clientName: string
  service: string
  date: string
  time: string
  duration: number
  totalPrice: number
  location: string
  telegramId: string
}

async function sendTelegramMessage(
  telegramId: string,
  message: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      console.error('Telegram API error:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send Telegram message:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId, bookingData } = body as {
      telegramId: string
      bookingData: BookingData
    }

    if (!telegramId || !bookingData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Format booking confirmation message
    const message = `
<b>✅ Booking Confirmation</b>

<b>Booking ID:</b> ${bookingData.bookingId}
<b>Service:</b> ${bookingData.service}
<b>Date:</b> ${bookingData.date}
<b>Time:</b> ${bookingData.time}
<b>Duration:</b> ${bookingData.duration} minutes
<b>Location:</b> ${bookingData.location}
<b>Total Price:</b> ₱${bookingData.totalPrice}

Your booking has been submitted for approval. Our therapist will review and confirm within 24 hours.

You'll receive payment details via this chat once approved.

Thank you for choosing King's Massage Therapy! 🙏
    `.trim()

    const success = await sendTelegramMessage(telegramId, message)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to send Telegram notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Notification sent' })
  } catch (error) {
    console.error('Telegram notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
