import { RefreshCw } from 'lucide-react'
import { reloadForUpdate, usePwa } from '../../lib/pwa'

// Appears when a newer version of the app has been deployed than the one running in this tab.
export function UpdateBanner() {
  const { updateReady } = usePwa()
  if (!updateReady) return null

  return (
    <div className="po-update-banner" role="status" aria-live="polite">
      <RefreshCw size={16} aria-hidden="true" />
      <span>A new version of Personal OS is ready.</span>
      <button type="button" className="po-primary" onClick={reloadForUpdate}>Reload</button>
    </div>
  )
}
