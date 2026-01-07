import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
    to,
    subject,
    html,
    from = 'onboarding@resend.dev' // Replace with your domain in prod
}: {
    to: string
    subject: string
    html: string
    from?: string
}) {
    // If no API key, log and fake it (Development mode)
    if (!process.env.RESEND_API_KEY) {
        console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`)
        return { id: 'mock-id-' + Date.now(), success: true }
    }

    try {
        const { data, error } = await resend.emails.send({
            from: from,
            to: [to],
            subject: subject,
            html: html,
        })

        if (error) {
            console.error('Resend Error:', error)
            return { error: error.message, success: false }
        }

        return { id: data?.id, success: true }
    } catch (e: any) {
        console.error('Email Exception:', e)
        return { error: e.message, success: false }
    }
}
