'use client';

/**
 * Pure-CSS live steam overlay. Mount inside a relatively-positioned image
 * container. Animations run only while `live` is true (toggle via
 * IntersectionObserver so off-screen cards cost nothing).
 */
export default function SteamPuffs({ live = true, large = false }: { live?: boolean; large?: boolean }) {
  return (
    <div className={`steam ${large ? 'steam-lg' : ''}`} data-live={live ? 'on' : 'off'} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}
