import type {LoaderArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useLoaderData} from '@remix-run/react'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/lib/prisma.server'
import {requireUser} from '~/lib/session.server'

export const loader = async ({request}: LoaderArgs) => {
	await requireUser(request)

	const recipes = await db.recipe.findMany({
		include: {
			user: true,
		},
	})

	return json({
		recipes: recipes,
	})
}

export default function ManageProduct() {
	const {recipes} = useLoaderData<typeof loader>()

	return (
		<>
			<TailwindContainer className="rounded-md bg-white">
				<div className="mt-8 px-4 py-10 sm:px-6 lg:px-8">
					<div className="sm:flex sm:flex-auto sm:items-center sm:justify-between">
						<div>
							<h1 className="text-xl font-semibold text-gray-900">
								View all Recipes
							</h1>
							<p className="mt-2 text-sm text-gray-700">
								A list of all the recipes currently present in store.
							</p>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<table className="min-w-full divide-y divide-gray-300">
									<thead>
										<tr>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Name
											</th>
											<th
												scope="col"
												className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 md:pl-0"
											>
												Created By
											</th>
											<th
												scope="col"
												className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 sm:table-cell"
											>
												Cooking Time
											</th>
											<th
												scope="col"
												className="relative py-3.5 pl-3 pr-4 sm:pr-6 md:pr-0"
											>
												<span className="sr-only">Actions</span>
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-gray-200">
										{recipes.map(recipe => (
											<tr key={recipe.id}>
												<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 md:pl-0">
													{recipe.name}
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													{recipe.user.name}
												</td>
												<td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
													{recipe.cookingTime}
												</td>

												<td className="relative space-x-4 whitespace-nowrap py-4 pl-3 pr-4 text-left text-sm font-medium sm:pr-6 md:pr-0"></td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>
		</>
	)
}
