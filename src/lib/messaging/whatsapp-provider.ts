
export async function sendWhatsApp({
    to,
    message, // For text messages or template params
    templateName, // If using templates
    language = 'en_US'
}: {
    to: string
    message?: string
    templateName?: string
    language?: string
}) {
    const token = process.env.META_WHATSAPP_TOKEN
    const phoneId = process.env.META_WHATSAPP_PHONE_ID

    if (!token || !phoneId) {
        console.log(`[MOCK WHATSAPP] To: ${to}, Template: ${templateName}, Msg: ${message}`)
        return { id: 'mock-wa-' + Date.now(), success: true }
    }

    try {
        const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`

        let body: any = {
            messaging_product: 'whatsapp',
            to: to, // Format: 919876543210 (No +)
        }

        if (templateName) {
            body.type = 'template'
            body.template = {
                name: templateName,
                language: { code: language },
                // simplified: assuming no components for now or message is passed differently
                // For dynamic templates, we need components logic.
                // If message is provided, we assume it's the raw text for a 'text' type message (if allowed)
                // OR we map it to body parameters.
                // For this MVP, we support TEXT messages directly if no templateName, or Template with no params if templateName provided.
            }
        } else if (message) {
            body.type = 'text'
            body.text = { body: message }
        } else {
            return { error: 'No content provided', success: false }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Meta API Error:', data)
            return { error: data.error?.message || 'Unknown Meta Error', success: false }
        }

        return { id: data.messages?.[0]?.id, success: true }
    } catch (e: any) {
        console.error('WhatsApp Exception:', e)
        return { error: e.message, success: false }
    }
}
