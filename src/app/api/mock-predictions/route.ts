import { getMockPrediction } from '@/services/mockPredictionsStore'
import { logMock } from '@/utils/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const currentPrediction = getMockPrediction()

  if (!currentPrediction) {
    logMock('No mock prediction found')
    return NextResponse.json(
      { message: 'No mock prediction found' },
      { status: 404 }
    )
  }

  return NextResponse.json(currentPrediction)
}
