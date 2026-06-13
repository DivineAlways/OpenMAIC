import { GameRewardsDisclosure } from '@/components/game-rewards-disclosure'

// Renders the rewards/OCC disclosure on every game page (ADR-005 launch blocker).
export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GameRewardsDisclosure />
    </>
  )
}
