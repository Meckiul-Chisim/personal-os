import { memo } from 'react'

// Stars are generated once with a fixed seed so they never jump around between renders.
const STAR_COUNT = 64
const stars = (() => {
  let seed = 7
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  return Array.from({ length: STAR_COUNT }, () => ({
    left: `${(random() * 100).toFixed(2)}%`,
    top: `${(random() * 100).toFixed(2)}%`,
    size: `${(1 + random() * 1.6).toFixed(2)}px`,
    delay: `${(random() * 6).toFixed(2)}s`,
    duration: `${(3 + random() * 4).toFixed(2)}s`,
  }))
})()

/**
 * Fixed, non-interactive scenery behind the app.
 * Light mode: two soft colour glows. Dark mode: a quiet night sky with stars, a moon and
 * an occasional shooting star. Motion is switched off by the user's reduced-motion setting.
 */
function BackdropView({ dark }: { dark: boolean }) {
  return (
    <div className="po-backdrop" aria-hidden="true">
      <span className="po-glow po-glow-a" />
      <span className="po-glow po-glow-b" />
      {dark && (
        <>
          <div className="po-stars">
            {stars.map((star, index) => (
              <i
                key={index}
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  animationDelay: star.delay,
                  animationDuration: star.duration,
                }}
              />
            ))}
          </div>
          <span className="po-shooting-star po-shooting-star-a" />
          <span className="po-shooting-star po-shooting-star-b" />
          <span className="po-moon" />
        </>
      )}
    </div>
  )
}

export const Backdrop = memo(BackdropView)
