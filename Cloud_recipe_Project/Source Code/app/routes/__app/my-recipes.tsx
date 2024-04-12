import {Anchor, Button, Modal, TextInput, Textarea} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {ActionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import * as React from 'react'
import slugify from 'slugify'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/lib/prisma.server'
import {getUserId, requireUser} from '~/lib/session.server'
import {useAppData, useUser} from '~/utils/hooks'
import * as mime from 'mime-types'
import axios from 'axios'
import {getS3Url, getUniqueS3Key} from '~/utils/s3-utils.client'
import {showNotification} from '@mantine/notifications'
import {sendEmail} from '~/utils/ses.server'
import {sleep} from '~/utils/misc'

export const action = async ({request}: ActionArgs) => {
	const user = await requireUser(request)
	const formData = await request.formData()

	const name = formData.get('name')?.toString()
	const description = formData.get('description')?.toString()
	const integredients = formData.get('integredients')?.toString()
	const cookingTime = formData.get('cookingTime')?.toString()
	const image = formData.get('image')?.toString()

	if (!name || !description || !integredients || !cookingTime || !image) {
		return json({success: false}, {status: 400})
	}

	await db.recipe.create({
		data: {
			name,
			description,
			integredients,
			cookingTime,
			image,
			slug: slugify(name, {lower: true}),
			user: {
				connect: {
					id: user.id,
				},
			},
		},
	})

	for (const subscriber of user.subsbribers) {
		await sendEmail({
			to: subscriber.email,
			subject: `${user.name} just added a new recipe!`,
			text: `${user.name} just added a new recipe!`,
		})

		await sleep(1000)
	}

	return json({success: true})
}

export default function Dashboard() {
	const {recipes} = useAppData()
	const user = useUser()
	const fetcher = useFetcher()

	const [image, setImage] = React.useState<File | null>(null)

	const [isImageUploading, setIsImageUploading] = React.useState(false)
	const [isModalOpen, {open: openModal, close: closeModal}] =
		useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	const imageKey = React.useMemo(() => {
		if (!image) return null

		const extension = mime.extension(image.type)
		const key = getUniqueS3Key(
			image.name,
			extension ? `.${extension}` : undefined
		)

		return key
	}, [image])

	React.useEffect(() => {
		if (isSubmitting) {
			return
		}

		if (!fetcher.data) return

		if (fetcher.data.success) {
			closeModal()
		}
	}, [closeModal, fetcher.data])

	const userRecipes = React.useMemo(() => {
		return recipes.filter(recipe => recipe.user.id === user.id)
	}, [recipes, user.id])

	const handleFileUpload = async () => {
		if (!image || !imageKey) return

		const data = await axios.get<{
			signedUrl: string
		}>(`/api/s3?key=${imageKey}`)

		const uploadUrl = data.data.signedUrl

		const contentType = mime.contentType(image.type)
		const response = await axios.put(uploadUrl, image, {
			headers: {
				'Content-Type': contentType,
			},
		})
		if (response.status === 200) {
			return getS3Url(imageKey)
		} else {
			return null
		}
	}

	return (
		<>
			<div className="flex flex-col gap-4 p-4">
				<div className="bg-white">
					<TailwindContainer>
						<div className="py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
							<div className="flex items-center justify-between">
								<h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
									My Recipes
								</h2>

								<Button onClick={openModal}>Add Recipe</Button>
							</div>

							<div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
								{userRecipes.length > 0 ? (
									userRecipes.map(recipe => {
										return (
											<div
												key={recipe.id}
												className="relative mx-auto sm:mx-[unset]"
											>
												<div className="h-48 overflow-hidden rounded-md bg-gray-200 shadow lg:h-64">
													<img
														src={recipe.image}
														alt={recipe.name}
														className="h-full w-full object-cover object-center"
													/>
												</div>

												<h3 className="mt-4 text-sm text-gray-700">
													<Anchor
														to={`/recipe/${recipe.slug}`}
														prefetch="intent"
														component={Link}
														className="absolute inset-0"
													></Anchor>
												</h3>

												<p className="text-md">{recipe.name}</p>

												<Button
													to={`/recipe/${recipe.slug}`}
													component={Link}
													variant="light"
													fullWidth
													mt="md"
												>
													View
												</Button>
											</div>
										)
									})
								) : (
									<p className="text-gray-500">You have no recipes yet.</p>
								)}
							</div>
						</div>
					</TailwindContainer>
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					closeModal()
				}}
				title="Add Recipe"
				centered
				overlayBlur={1}
				overlayOpacity={0.7}
			>
				<fetcher.Form
					method="post"
					replace
					onSubmit={async e => {
						e.preventDefault()
						setIsImageUploading(true)
						const formData = new FormData(e.currentTarget)

						if (!image || !imageKey) return

						const url = await handleFileUpload()

						if (!url) {
							setIsImageUploading(false)
							showNotification({
								title: 'Error',
								message: 'Failed to upload image',
								color: 'red',
							})
							return
						}

						formData.append('image', url)

						fetcher.submit(formData, {
							method: 'post',
							replace: true,
						})
					}}
				>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<TextInput
							name="name"
							label="Name"
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<Textarea
							name="description"
							label="Description"
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<Textarea
							name="integredients"
							label="Integredients"
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<Textarea
							name="cookingTime"
							label="Cooking Time"
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<input
							type="file"
							accept="image/*"
							onChange={e => setImage(e.currentTarget.files?.[0] ?? null)}
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting || isImageUploading}
								onClick={() => {
									closeModal()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting || isImageUploading}
								loaderPosition="right"
							>
								Save Recipe
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
