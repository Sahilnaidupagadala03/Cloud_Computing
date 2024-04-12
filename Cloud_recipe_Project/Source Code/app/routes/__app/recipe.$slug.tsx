import {Button, Modal, TextInput, Textarea} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {ActionArgs, LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Form, useFetcher, useLoaderData} from '@remix-run/react'
import * as React from 'react'
import {db} from '~/lib/prisma.server'
import {getUserId} from '~/lib/session.server'
import {useOptionalUser, useRecipe} from '~/utils/hooks'
import * as mime from 'mime-types'
import axios from 'axios'
import {getS3Url, getUniqueS3Key} from '~/utils/s3-utils.client'
import {showNotification} from '@mantine/notifications'

export const loader = async ({params, request}: LoaderArgs) => {
	const currentUserId = await getUserId(request)
	const {slug} = params

	if (!slug) {
		throw new Response('No slug provided', {status: 404})
	}

	return json({slug, currentUserId})
}

export const action = async ({request}: ActionArgs) => {
	const userId = await getUserId(request)
	const formData = await request.formData()

	const recipeId = formData.get('recipeId')?.toString()
	const name = formData.get('name')?.toString()
	const description = formData.get('description')?.toString()
	const integredients = formData.get('integredients')?.toString()
	const cookingTime = formData.get('cookingTime')?.toString()
	const image = formData.get('image')?.toString()

	if (
		!name ||
		!description ||
		!integredients ||
		!cookingTime ||
		!image ||
		!recipeId
	) {
		return json({success: false}, {status: 400})
	}

	await db.recipe.update({
		where: {id: recipeId},
		data: {
			name,
			description,
			integredients,
			cookingTime,
			image,
			userId,
		},
	})

	return json({success: true})
}

export default function Item() {
	const fetcher = useFetcher()

	const {slug, currentUserId} = useLoaderData<typeof loader>()
	const recipe = useRecipe(slug)
	const user = useOptionalUser()

	const [image, setImage] = React.useState<File | null>(null)
	const [imageUrl, setImageUrl] = React.useState<string>()
	const [isModalOpen, {open: openModal, close: closeModal}] =
		useDisclosure(false)

	const [isImageUploading, setIsImageUploading] = React.useState(false)
	const imageUploadFetcher = useFetcher()
	const isUserLoggedIn = Boolean(user)
	const doesRecipeBelongToUser = recipe?.user.id === currentUserId
	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (isSubmitting) {
			return
		}

		if (!fetcher.data) return

		if (fetcher.data.success) {
			closeModal()
		}
	}, [closeModal, fetcher.data?.success, fetcher.state])

	const imageKey = React.useMemo(() => {
		if (!image) return null

		const extension = mime.extension(image.type)
		const key = getUniqueS3Key(
			image.name,
			extension ? `.${extension}` : undefined
		)

		return key
	}, [image])

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

	if (!recipe) {
		return null
	}

	return (
		<>
			<div className="flex flex-col gap-4 p-4">
				<div className="bg-white">
					<div className="mx-auto max-w-2xl py-16 px-4 sm:py-24 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-12 lg:px-8">
						<div className="sm:mt-10 lg:row-span-2 lg:mt-0 lg:self-center">
							<div className="overflow-hidden rounded-lg shadow">
								<img
									src={recipe.image}
									alt={recipe.name}
									className="aspect-square w-full object-cover"
								/>
							</div>
						</div>

						<div className="lg:col-start-2 lg:max-w-lg lg:self-end">
							<div className="mt-4">
								<h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
									{recipe.name}
								</h1>
							</div>

							<section aria-labelledby="information-heading" className="mt-4">
								<h2 id="information-heading" className="sr-only">
									Cuisine information
								</h2>

								<div className="mt-4 space-y-6">
									<p className="text-base text-gray-500">
										{recipe.description}
									</p>
								</div>

								<div className="mt-4">
									<div className="space-y-6">
										<span>Integredients</span>
									</div>

									<p className="mt-1 text-gray-500">{recipe.integredients}</p>
								</div>

								<div className="mt-4">
									<div className="space-y-6">
										<span>Cooking Time</span>
									</div>

									<p className="mt-1 text-gray-500">{recipe.cookingTime}</p>
								</div>

								<div className="mt-4">
									<div className="space-y-6">
										<span>Created by</span>
									</div>

									<p className="mt-1 text-gray-500">
										{recipe.user.name} ({recipe.user.email})
									</p>
								</div>

								{doesRecipeBelongToUser && (
									<div className="mt-6 lg:col-start-2 lg:row-start-2 lg:max-w-lg lg:self-start">
										<Button
											fullWidth
											mt="2.5rem"
											disabled={!isUserLoggedIn}
											onClick={openModal}
										>
											Edit
										</Button>
									</div>
								)}
							</section>
						</div>
					</div>
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					closeModal()
				}}
				title="Edit Recipe"
				centered
				overlayBlur={1}
				overlayOpacity={0.7}
			>
				<div className="mb-4 flex items-center gap-2">
					<input
						type="file"
						accept="image/*"
						onChange={e => setImage(e.currentTarget.files?.[0] ?? null)}
					/>
					<Button
						type="submit"
						compact
						variant="light"
						disabled={!image || !imageKey || isImageUploading}
						loading={isImageUploading}
						onClick={async e => {
							e.preventDefault()
							setIsImageUploading(true)

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

							setImageUrl(url)
							setIsImageUploading(false)
						}}
					>
						Update image
					</Button>
				</div>

				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="recipeId" value={recipe.id} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={recipe.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<Textarea
							name="description"
							label="Description"
							defaultValue={recipe.description}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<Textarea
							name="integredients"
							label="Integredients"
							defaultValue={recipe.integredients}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<Textarea
							name="cookingTime"
							label="Cooking Time"
							defaultValue={recipe.cookingTime}
							error={fetcher.data?.fieldErrors?.description}
							required
						/>

						<TextInput
							name="image"
							label="Image"
							value={imageUrl}
							defaultValue={recipe.image}
							onChange={e => setImageUrl(e.target.value)}
							error={fetcher.data?.fieldErrors?.image}
							required
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									closeModal()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
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
