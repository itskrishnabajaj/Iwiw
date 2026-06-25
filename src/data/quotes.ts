export const QUOTES: { text: string; author: string }[] = [
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
  { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'The future depends on what you do today.', author: 'Mahatma Gandhi' },
  { text: 'Do not pray for an easy life, pray for the strength to endure a difficult one.', author: 'Bruce Lee' },
  { text: 'Hard choices, easy life. Easy choices, hard life.', author: 'Jerzy Gregorek' },
  { text: 'You will never always be motivated. You have to learn to be disciplined.', author: 'Anonymous' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
  { text: 'Compound interest is the eighth wonder of the world.', author: 'Albert Einstein' },
  { text: 'Amateurs sit and wait for inspiration, the rest of us just get up and go to work.', author: 'Stephen King' },
  { text: 'Build something 100 people love, not something a million people kind of like.', author: 'Brian Chesky' },
]

export function quoteOfDay(seedExtra = 0) {
  const idx = (new Date().getDate() + seedExtra) % QUOTES.length
  return QUOTES[idx]
}
