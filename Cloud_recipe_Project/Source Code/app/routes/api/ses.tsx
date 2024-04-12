import {json} from '@remix-run/node'
import {sendEmail} from '~/utils/ses.server'

export const loader = async () => {
	const response = await sendEmail({
		to: 'k.gautam.t@gmail.com',
		subject: 'Test email',
		text: 'Hello from SES!',
	})

	return json(response)
}
