import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef, type ReactNode } from "react"

export function PageDrift({
  children,
  distance,
  className,
}: {
  children: ReactNode
  distance: number
  className?: string
}) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, reduce ? 0 : distance])

  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

export function ScrollShift({
  children,
  from,
  to,
  className,
}: {
  children: ReactNode
  from: number
  to: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [from, to])

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}
