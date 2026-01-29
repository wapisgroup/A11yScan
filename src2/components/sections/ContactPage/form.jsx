import { useState } from "react"
import { Button } from "../../atom/button"

export const ContactPageForm = () => {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [company, setCompany] = useState('')
    const [plan, setPlan] = useState('Free')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(null) // null | true | false
    const [errorMessage, setErrorMessage] = useState('')
    const [honeypot, setHoneypot] = useState('')

    const validate = () => {
        if (honeypot) return 'Bot detected'
        if (!name.trim()) return 'Please enter your name'
        if (!email.trim()) return 'Please enter your email'
        // simple email regex
        if (!/^\S+@\S+\.\S+$/.test(email)) return 'Please enter a valid email address'
        if (!message.trim()) return 'Please add a short message describing your enquiry'
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        const v = validate()
        if (v) {
            setErrorMessage(v);
            return
        }

        const payload = { name, email, company, plan, message }
        setLoading(true)
        setSuccess(null)

        try {
            // Try to POST to /api/contact (serverless function). If your backend path differs, update it.
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setSuccess(true)
                setName('');
                setEmail('');
                setCompany('');
                setMessage('');
                setPlan('Free')
            } else {
                // if server returns error, fallback to mailto
                const txt = await res.text().catch(() => null)
                setErrorMessage(txt || 'Server rejected the request — opening email client as fallback.')
                openMailTo(payload)
                setSuccess(false)
            }
        } catch (err) {
            // network error - fallback to mailto
            setErrorMessage('Unable to reach the server — opening your email client as fallback.')
            openMailTo(payload)
            setSuccess(false)
        } finally {
            setLoading(false)
        }
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* honeypot - visually hidden */}
            <label className="sr-only">Leave this field empty</label>
            <input value={honeypot} onChange={e => setHoneypot(e.target.value)} name="company_name"
                className="hidden" autoComplete="off" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-medium">
                <div>
                    <label className="block primary-text-color as-p3-text mb-1 font-semibold">Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="w-full input"
                        placeholder="Jane Doe" />
                </div>

                <div>
                    <label className="block primary-text-color as-p3-text mb-1 font-semibold">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full input"
                        placeholder="you@company.com" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-medium">
                <div>
                    <label className="block primary-text-color as-p3-text mb-1 font-semibold">Company (optional)</label>
                    <input value={company} onChange={e => setCompany(e.target.value)}
                        className="w-full input"
                        placeholder="Acme Agency" />
                </div>

                <div>
                    <label className="block primary-text-color as-p3-text mb-1 font-semibold">Interested plan</label>
                    <select value={plan} onChange={e => setPlan(e.target.value)}
                        className="w-full input">
                        <option>Free</option>
                        <option>Team</option>
                        <option>Agency</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block primary-text-color as-p3-text mb-1 font-semibold">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6}
                    className="w-full input"
                    placeholder="Tell us what you'd like to achieve, size of site, private/staging access, or any questions" />
            </div>

            {errorMessage && <div className="text-red-400 as-p2-text">{errorMessage}</div>}
            {success === true &&
                <div className="text-green-300 as-p2-text">Thanks — your message was sent. We'll be in
                    touch shortly.</div>}
            {success === false &&
                <div className="text-yellow-300 as-p2-text">Message could not be sent via the site.
                    Your email client was opened as fallback.</div>}

            <div className="flex items-center gap-3">
                <Button form type="primary" disabled={loading} title={loading ? 'Sending…' : 'Send message'} />
                <Button type="neutral" title={`Clear`} onClick={() => {
                    setName('');
                    setEmail('');
                    setCompany('');
                    setMessage('');
                    setPlan('Free');
                    setErrorMessage('');
                    setSuccess(null)
                }} />
            </div>

        </form>
    )
}