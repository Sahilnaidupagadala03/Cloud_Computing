import * as nodemailer from 'nodemailer'
import invariant from 'tiny-invariant'

const REGION = process.env.AWS_REGION
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY

invariant(ACCESS_KEY_ID, 'Missing AWS_ACCESS_KEY_ID')
invariant(SECRET_ACCESS_KEY, 'Missing AWS_SECRET_ACCESS_KEY')
invariant(REGION, 'Missing AWS_REGION')

const transporter = nodemailer.createTransport({
	host: 'email-smtp.us-west-2.amazonaws.com',
	port: 465,
	auth: {
		user: 'AKIAUXRUN2OBUVULEXMF',
		pass: 'BOfsZVGSwpcYvuARirlqSf+7XkSupbCoVyu9dmOVMaZx',
	},
	debug: true,
})

type SendEmailArgs = {
	to: string
	subject: string
	text: string
}
export const sendEmail = async (args: SendEmailArgs) => {
	try {
		const response = await transporter.sendMail({
			from: 'jakkana.asha26@gmail.com',
			...args,
		})

		console.log(response)
		return response
	} catch (error) {
		console.error(error)
		return error
	}
}
