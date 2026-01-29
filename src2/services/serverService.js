/* Utility to call server-side function:
   - first attempts Firebase Callable function if `functions` exists
   - otherwise POSTs to Vite env variable VITE_FUNCTIONS_BASE_URL/<name>
   - when running on localhost (no env) it will try the Functions emulator default URL
*/
import {functions} from "../utils/firebase";
import {httpsCallable} from "firebase/functions";

export async function callServerFunction(name, payload = {}) {
    // prefer Vite env var (use VITE_ prefix for Vite)
    const viteBase = typeof import.meta !== 'undefined' && import.meta.env
        ? (import.meta.env.VITE_FUNCTIONS_BASE_URL || import.meta.env.VITE_REACT_APP_FUNCTIONS_BASE_URL || '')
        : ''

    // Try callable function first (if firebase functions SDK is initialized)
    if (typeof functions !== 'undefined' && functions) {
        try {
            const fn = httpsCallable(functions, name)
            const res = await fn(payload)
            return res.data
        } catch (err) {
            console.warn('Callable function failed, falling back to HTTP:', err)
        }
    }

    // Decide base URL: use Vite env if available
    let base = viteBase || ''

    // If no base and we're on localhost, try Functions emulator default
    if (!base && typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        // Default Functions emulator port is 5001 and callable functions are served at /<project>/us-central1/<name>
        console.log('import.meta.env', import.meta.env)
        const projectId = import.meta.env?.VITE_FIREBASE_PROJECT || import.meta.env?.VITE_PROJECT_ID || ''
        const host = (import.meta.env?.VITE_FUNCTIONS_EMULATOR_HOST) || 'http://localhost:5001'
        base = projectId ? `${host}/${projectId}/us-central1` : host
    }

    if (!base) {
        throw new Error('No functions available: export `functions` from utils/firebase or set VITE_FUNCTIONS_BASE_URL')
    }

    const url = base.replace(/\/$/, '') + `/${name}`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        const text = await res.text().catch(() => null)
        throw new Error(text || `Server returned ${res.status}`)
    }
    return res.json().catch(() => ({}))
}
