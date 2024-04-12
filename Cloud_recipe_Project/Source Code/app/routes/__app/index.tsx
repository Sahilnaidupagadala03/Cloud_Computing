import {ArrowRightIcon} from '@heroicons/react/24/solid'
import {ActionIcon, Anchor} from '@mantine/core'
import {SerializeFrom, json, redirect} from '@remix-run/node'
import {Link} from '@remix-run/react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {AppLoaderData} from '~/routes/__app'
import {useAppData} from '~/utils/hooks'
import type {LoaderArgs} from '@remix-run/node'
import {db} from '~/lib/prisma.server'

export default function UserProfile() {
	const {recipes} = useAppData()

	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="bg-white">
				<TailwindContainer>
					<div className="py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
						<h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
							Recipes
						</h2>

						<ul
							role="list"
							className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8"
						>
							{recipes.map(recipe => (
								<Card key={recipe.id} recipe={recipe} />
							))}
						</ul>
					</div>
				</TailwindContainer>
			</div>
		</div>
	)
}

function Card({recipe}: {recipe: SerializeFrom<AppLoaderData>['recipes'][0]}) {
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
				<div className="flex justify-between gap-x-4 py-3">
					<dt className="text-gray-500">Cooking Time</dt>
					<dd className="flex items-start gap-x-2">
						<div className="font-medium text-gray-900">
							{recipe.cookingTime}
						</div>
					</dd>
				</div>
				<div className="flex justify-between gap-x-4 py-3">
					<dt className="text-gray-500">Author</dt>
					<dd className="text-gray-700">
						<Anchor component={Link} to={`user/${recipe.user.id}`}>
							{recipe.user.name}
						</Anchor>
					</dd>
				</div>
			</dl>
		</li>
	)
}
