import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MAIN_PLATFORM_BACKEND_URL || "https://onlycrypto-backend-ch83e.ondigitalocean.app"
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || ""

// Called by the live room when a member sends their first chat message in a session.
// Forwards to the main platform backend which awards 1,000 drops (idempotent).
export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("openmaic_access")
  if (!cookie?.value?.startsWith("sso.")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { user_id, session_id } = await req.json()
  if (!user_id || !session_id) {
    return NextResponse.json({ error: "user_id and session_id required" }, { status: 400 })
  }

  try {
    const res = await fetch(`${BACKEND_URL}/admin/drops/live-comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": ADMIN_API_KEY,
      },
      body: JSON.stringify({ user_id, session_id }),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to award drops" }, { status: 500 })
  }
}
