import {PrismaClient} from '@prisma/client'
import {createPasswordHash} from '~/utils/misc.server'
import {Role} from '~/utils/types'

const db = new PrismaClient()

async function seed() {
	await db.user.deleteMany()
	await db.recipe.deleteMany()

	const user = await db.user.create({
		data: {
			name: 'Asha',
			email: 'jakkana.asha26@gmail.com',
			password: await createPasswordHash('password'),
			role: Role.CUSTOMER,
		},
	})

	await db.user.create({
		data: {
			name: 'Roxanna',
			email: 'demo@admin.com',
			password: await createPasswordHash('password'),
			role: Role.ADMIN,
		},
	})

	await db.recipe.create({
		data: {
			name: 'Pasta',
			description: 'Pasta with tomato sauce',
			image:
				'https://plus.unsplash.com/premium_photo-1673809798970-30c14cfd0ab6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1064&q=80',
			slug: 'pasta',
			user: {
				connect: {
					id: user.id,
				},
			},
			integredients: 'Pasta, Tomato, Salt, Pepper, Olive Oil',
			cookingTime: '20 minutes',
		},
	})

	console.log(`Database has been seeded. 🌱`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await db.$disconnect()
	})
