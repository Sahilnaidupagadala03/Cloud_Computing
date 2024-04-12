import {ArrowRightIcon} from '@heroicons/react/24/solid'
import {ActionIcon, Badge, Button} from '@mantine/core'
import {showNotification} from '@mantine/notifications'
import type {ActionArgs} from '@remix-run/node'
import {LoaderArgs, SerializeFrom, json, redirect} from '@remix-run/node'
import {Link, useFetcher, useLoaderData} from '@remix-run/react'
import {useEffect} from 'react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/lib/prisma.server'
import {getUserId, requireUser} from '~/lib/session.server'
import {useOptionalUser} from '~/utils/hooks'
import {sendEmail} from '~/utils/ses.server'

export async function loader({params, request}: LoaderArgs) {
	const {userId} = params
	const currentUserId = await getUserId(request)

	if (!userId) {
		return redirect('/')
	}

	const user = await db.user.findFirst({
		where: {
			id: userId,
		},
		include: {
			recipies: true,
			subsbribers: true,
			_count: true,
		},
	})

	if (!user) {
		return redirect('/')
	}

	const isCurrentUserAlreadyFollowing = user.subsbribers.some(
		subscriber => subscriber.id === currentUserId
	)

	return json({
		user,
		isCurrentUserAlreadyFollowing,
	})
}

export async function action({request, params}: ActionArgs) {
	const {userId} = params
	const formData = await request.formData()
	const currentUser = await requireUser(request)

	const userToFollow = await db.user.findFirst({
		where: {
			id: userId,
		},
	})

	if (!userToFollow) {
		return redirect('/')
	}

	const intent = formData.get('intent')?.toString()

	if (intent === 'follow') {
		await db.user.update({
			where: {
				id: currentUser.id,
			},
			data: {
				subscribtions: {
					connect: {
						id: userToFollow.id,
					},
				},
			},
		})

		await sendEmail({
			to: userToFollow.email,
			subject: 'New Subscriber',
			text: `${currentUser.name} has subscribed to your recipes`,
		})

		return json({
			success: true,
			message: 'Followed',
		})
	}

	if (intent === 'unfollow') {
		await db.user.update({
			where: {
				id: currentUser.id,
			},
			data: {
				subscribtions: {
					disconnect: {
						id: userToFollow.id,
					},
				},
			},
		})

		await sendEmail({
			to: currentUser.email,
			subject: 'Unsubscribed',
			text: `You have unsubscribed from ${userToFollow.name} recipes`,
		})

		return json({
			success: true,
			message: 'Unfollowed',
		})
	}

	return json({
		success: false,
		message: 'Invalid intent',
	})
}

export default function Dashboard() {
	const {user, isCurrentUserAlreadyFollowing} = useLoaderData<typeof loader>()
	const fetcher = useFetcher<typeof action>()
	const {user: currentUser} = useOptionalUser()

	const isSubmitting = fetcher.state !== 'idle'

	useEffect(() => {
		if (isSubmitting) return
		if (!fetcher.data) return

		if (fetcher.data.success) {
			showNotification({
				title: 'Success',
				message: fetcher.data.message,
			})
		}
	}, [isSubmitting, fetcher.data])

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="bg-white">
				<TailwindContainer>
					<div className="py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
								{user.name} Recipes
							</h2>

							<div className="flex items-center gap-4">
								{user._count.subsbribers > 0 && (
									<Badge color="teal">
										{user._count.subsbribers} Subscribers
									</Badge>
								)}

								{currentUser && (
									<Button
										loading={isSubmitting}
										onClick={() => {
											fetcher.submit(
												{
													intent: isCurrentUserAlreadyFollowing
														? 'unfollow'
														: 'follow',
												},
												{
													method: 'post',
												}
											)
										}}
									>
										{isCurrentUserAlreadyFollowing ? 'Unfollow' : 'Follow'}
									</Button>
								)}
							</div>
						</div>

						<ul
							role="list"
							className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8"
						>
							{user.recipies.map(recipe => (
								<Card key={recipe.id} recipe={recipe} />
							))}
						</ul>
					</div>
				</TailwindContainer>
			</div>
		</div>
	)
}

function Card({
	recipe,
}: {
	recipe: SerializeFrom<typeof loader>['user']['recipies'][0]
}) {
	return (
		<li className="overflow-hidden rounded-xl border border-gray-200">
			<div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
				<img
					src={recipe.image}
					alt={recipe.name}
					className="h-12 w-12 flex-none rounded-lg bg-white object-cover ring-1 ring-gray-900/10"
				/>
				<div className="text-sm font-medium leading-6 text-gray-900">
					{recipe.name}
				</div>

				<ActionIcon component={Link} to={`/recipe/${recipe.slug}`}>
					<ArrowRightIcon className="h-5 w-5" />
				</ActionIcon>
			</div>
			<dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm leading-6">
				<div className="flex flex-col gap-2 py-3">
					<dt className="text-gray-400">Cooking Time</dt>
					<dd className="flex items-start gap-x-2">
						<div className="font-medium text-gray-900">
							{recipe.cookingTime}
						</div>
					</dd>
				</div>
				<div className="flex flex-col gap-2 py-3">
					<dt className="text-gray-400">Integredients</dt>
					<dd className="text-gray-700">{recipe.integredients}</dd>
				</div>
				<div className="flex flex-col gap-2 py-3">
					<dt className="text-gray-400">Instructions</dt>
					<dd className="text-gray-700">{recipe.description}</dd>
				</div>
			</dl>
		</li>
	)
}
