import {
	ArrowLeftOnRectangleIcon,
	ArrowRightOnRectangleIcon,
	GlobeAltIcon,
	UserPlusIcon,
} from '@heroicons/react/24/solid'

import {
	Anchor,
	Avatar,
	Divider,
	Footer,
	Header,
	Menu,
	ScrollArea,
} from '@mantine/core'
import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Form, Link, Outlet, useLoaderData, useLocation} from '@remix-run/react'
import appConfig from 'app.config'
import {TailwindContainer} from '~/components/TailwindContainer'
import {db} from '~/lib/prisma.server'
import {isAdmin, isCustomer} from '~/lib/session.server'
import {useOptionalUser} from '~/utils/hooks'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	if (await isAdmin(request)) {
		return redirect('/admin')
	}

	const recipes = await db.recipe.findMany({
		include: {
			user: true,
		},
	})
	return json({recipes, isCustomer: await isCustomer(request)})
}

export default function AppLayout() {
	return (
		<>
			<div className="flex h-full flex-col">
				<HeaderComponent />
				<ScrollArea classNames={{root: 'flex-1 bg-gray-100'}}>
					<main>
						<Outlet />
					</main>
				</ScrollArea>

				<FooterComponent />
			</div>
		</>
	)
}

function HeaderComponent() {
	const location = useLocation()
	const {user} = useOptionalUser()
	const {isCustomer} = useLoaderData<typeof loader>()

	return (
		<>
			<Form replace action="/api/auth/logout" method="post" id="logout-form" />
			<Header height={80} p="md">
				<TailwindContainer>
					<div className="flex h-full w-full items-center justify-between">
						<div className="flex flex-shrink-0 items-center gap-4">
							<Anchor component={Link} to="/">
								<img
									className="h-9 object-cover object-center"
									src={appConfig.logo}
									alt="Logo"
								/>
							</Anchor>
						</div>

						<div className="flex items-center gap-4">
							<Menu
								position="bottom-start"
								withArrow
								transition="pop-top-right"
							>
								<Menu.Target>
									<button>
										{user ? (
											<Avatar color="blue" size="md">
												{user.name.charAt(0)}
											</Avatar>
										) : (
											<Avatar />
										)}
									</button>
								</Menu.Target>

								<Menu.Dropdown>
									{user ? (
										<>
											<Menu.Item disabled>
												<div className="flex flex-col gap-2">
													<p>{user.name}</p>
													<p className="mt-0.5 text-sm">{user.email}</p>
												</div>
											</Menu.Item>
											<Divider />
											<Menu.Item disabled>
												<div className="flex flex-col">
													<p>Subscribers: {user._count.subsbribers}</p>
													<p>Subscriptions: {user._count.subscribtions}</p>
												</div>
											</Menu.Item>
											<Divider />

											{isCustomer ? (
												<Menu.Item
													icon={<GlobeAltIcon className="h-4 w-4" />}
													component={Link}
													to="/my-recipes"
												>
													My Recipes
												</Menu.Item>
											) : null}
											<Menu.Item
												icon={<ArrowLeftOnRectangleIcon className="h-4 w-4" />}
												type="submit"
												form="logout-form"
											>
												Logout
											</Menu.Item>
										</>
									) : (
										<>
											<Menu.Item
												icon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
												component={Link}
												to={`/login?redirectTo=${encodeURIComponent(
													location.pathname
												)}`}
											>
												Login
											</Menu.Item>
											<Menu.Item
												icon={<UserPlusIcon className="h-4 w-4" />}
												component={Link}
												to={`/register?redirectTo=${encodeURIComponent(
													location.pathname
												)}`}
											>
												Create account
											</Menu.Item>
										</>
									)}
								</Menu.Dropdown>
							</Menu>
						</div>
					</div>
				</TailwindContainer>
			</Header>
		</>
	)
}

function FooterComponent() {
	return (
		<Footer
			height={44}
			p="md"
			className="flex items-center justify-center py-1 text-center text-sm"
		>
			<span className="text-gray-400">
				©{new Date().getFullYear()} {appConfig.name}, Inc. All rights reserved.
			</span>
		</Footer>
	)
}
