import confetti from 'canvas-confetti'

export function celebrate() {
  const colors = ['#7c5cff', '#36e6e0', '#a855f7', '#ffffff']
  confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors, scalar: 1.1 })
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors }), 150)
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors }), 250)
}

export function bigCelebrate() {
  const colors = ['#7c5cff', '#36e6e0', '#a855f7', '#f5c451', '#ffffff']
  const end = Date.now() + 1400
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors })
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  confetti({ particleCount: 160, spread: 100, origin: { y: 0.5 }, colors, scalar: 1.3 })
  frame()
}
