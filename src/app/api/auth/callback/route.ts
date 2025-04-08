import { NextRequest, NextResponse } from 'next/server'
import { setUserSession } from '@/services/sessionStore'
import { startEventSubSession } from '@/services/twitchSocket'
import { logError, logSuccess } from '@/utils/logger'
import axios from 'axios'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  if (!code) {
    logError('No code found in the URL')
    return NextResponse.json(
      { error: 'No code found in the URL' },
      { status: 400 }
    )
  }

  try {
    const response = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.TWITCH_REDIRECT_URI,
        },
      }
    )

    const token = response.data.access_token

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
    })

    const user = userResponse.data.data[0]
    const broadcasterId = user.id
    const displayName = user.display_name
    const login = user.login

    setUserSession(login, { token, broadcasterId })

    startEventSubSession(token, broadcasterId)

    logSuccess(`Authorization successful for ${displayName} (${broadcasterId})`)

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/predictions/${login}`
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    logError('Error getting the access token')
    return NextResponse.json(
      { error: 'Error getting the access token' },
      { status: 500 }
    )
  }
}
