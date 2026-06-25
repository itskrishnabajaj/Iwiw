import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { getLevel, AREA_META, weeklyXP, monthlyXP } from '@/store/selectors'
import { totalXP, titleForLevel, skillLevel, rankForLevel } from '@/lib/xp'
import { GlassCard } from '@/components/ui/GlassCard'
import { Progress } from '@/components/ui/Progress'
import { Ring } from '@/components/ui/Ring'
import { CountUp } from '@/components/ui/CountUp'
import { SectionTitle, Tag } from '@/components/ui/primitives'
import { evaluateAchievements, TIER_COLOR } from '@/data/achievements'

export default function ProgressPage() {
  const s = useAppStore()
  const overall = getLevel(s)
  const achievements = useMemo(() => evaluateAchievements(s), [s])
  const unlocked = achievements.filter((a) => a.unlocked)
  const sortedSkills = [...s.skills].sort((a, b) => b.xp - a.xp)
  const rank = rankForLevel(overall.level)
  const wXP = weeklyXP(s)
  const mXP = monthlyXP(s)

  return (
    <div className="space-y-6 pt-2">
      <SectionTitle title="Life Progress" subtitle="Your life, played as an RPG. XP comes from real work — never fake clicks." />

      {/* Hero level */}
      <GlassCard hoverable={false} className="flex flex-col items-center gap-6 p-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-6">
          <Ring value={overall.pct} size={140} color="#7c5cff">
            <div className="text-center">
              <div className="text-4xl font-black">{overall.level}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Level</div>
            </div>
          </Ring>
          <div>
            <div className="flex items-center gap-2">
              <Tag color={rank.rank.color}>{rank.rank.icon} {rank.rank.name}</Tag>
              <Tag>{titleForLevel(overall.level)}</Tag>
            </div>
            <div className="mt-2 text-3xl font-black"><CountUp value={totalXP(s.xpEvents)} suffix=" XP" /></div>
            <div className="mt-1 text-sm text-white/40">{overall.into} / {overall.needed} to next level</div>
            {rank.next && (
              <div className="mt-2 w-44">
                <div className="mb-1 flex justify-between text-[10px] text-white/35"><span>{rank.rank.name}</span><span>{rank.next.name}</span></div>
                <Progress value={rank.pct} color={rank.rank.color} height={5} />
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4 md:gap-6">
          <div><div className="text-2xl font-bold text-accent-soft">{unlocked.length}</div><div className="text-xs text-white/40">Achievements</div></div>
          <div><div className="text-2xl font-bold text-accent-cyan">{s.skills.length}</div><div className="text-xs text-white/40">Skills</div></div>
          <div><div className="text-2xl font-bold text-good"><CountUp value={wXP} /></div><div className="text-xs text-white/40">XP this week</div></div>
          <div><div className="text-2xl font-bold text-warn"><CountUp value={mXP} /></div><div className="text-xs text-white/40">XP this month</div></div>
        </div>
      </GlassCard>

      {/* Skill tree */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Skill Tree</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSkills.map((sk, i) => {
            const sl = skillLevel(sk)
            const meta = AREA_META[sk.area]
            return (
              <GlassCard key={sk.id} className="p-5" tilt delay={i * 0.05} glow={meta.color}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl" style={{ background: `${meta.color}20` }}>{sk.icon}</div>
                    <div>
                      <div className="font-semibold">{sk.name}</div>
                      <div className="text-[11px] text-white/40">{titleForLevel(sl.level)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black" style={{ color: meta.color }}>{sl.level}</div>
                    <div className="text-[10px] text-white/30">level</div>
                  </div>
                </div>
                <Progress value={sl.pct} color={meta.color} className="mt-4" />
                <div className="mt-1.5 flex justify-between text-[11px] text-white/35">
                  <span>{sk.xp.toLocaleString()} XP</span>
                  <span>{sl.into}/{sl.needed}</span>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>

      {/* Badges */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Badges</h2>
        <div className="flex flex-wrap gap-3">
          {unlocked.slice(0, 12).map((a) => (
            <motion.div key={a.id} whileHover={{ scale: 1.08, y: -3 }} className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl border text-center" style={{ borderColor: TIER_COLOR[a.tier] + '55', background: TIER_COLOR[a.tier] + '12' }}>
              <span className="text-2xl">{a.icon}</span>
              <span className="mt-1 px-1 text-[9px] leading-tight text-white/55">{a.title}</span>
            </motion.div>
          ))}
          {unlocked.length === 0 && <div className="text-sm text-white/35">Start logging work to earn your first badge.</div>}
        </div>
      </div>
    </div>
  )
}
