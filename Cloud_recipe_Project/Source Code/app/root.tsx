import {createEmotionCache, MantineProvider} from '@mantine/core'
import {ModalsProvider} from '@mantine/modals'
import {NotificationsProvider} from '@mantine/notifications'
import {StylesPlaceholder} from '@mantine/remix'
import type {
	LinksFunction,
	LoaderArgs,
	MetaFunction,
	SerializeFrom,
} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from '@remix-run/react'
import appConfig from 'app.config'
import {getUser} from './lib/session.server'
import styles from '~/styles/tailwind.css'

const appendCache = createEmotionCache({key: 'mantine', prepend: false})

export const links: LinksFunction = () => {
	return [{rel: 'stylesheet', href: styles}]
}

export type RootLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await getUser(request)
	return json({
		user,
		ENV: {
			AWS_BUCKET: process.env.AWS_BUCKET,
			AWS_REGION: process.env.AWS_REGION,
		},
	})
}

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: appConfig.name,
	viewport: 'width=device-width,initial-scale=1',
})

export function Document({
	title,
	children,
}: {
	title?: string
	children: React.ReactNode
}) {
	const data = useLoaderData<RootLoaderData>()
	return (
		<MantineProvider withNormalizeCSS emotionCache={appendCache}>
			<html lang="en" className="h-full">
				<head>
					{title ? <title>{title}</title> : null}
					<Meta />
					<Links />
					<StylesPlaceholder />
				</head>
				<body className="h-full">
					{children}
					<ScrollRestoration />
					<Scripts />
					<LiveReload />
					<script
						dangerouslySetInnerHTML={{
							__html: `
              window.ENV = ${JSON.stringify(data.ENV)};
            `,
						}}
					/>
				</body>
			</html>
		</MantineProvider>
	)
}

export default function App() {
	return (
		<Document>
			<ModalsProvider>
				<NotificationsProvider autoClose={2000} limit={3}>
					<Outlet />
				</NotificationsProvider>
			</ModalsProvider>
		</Document>
	)
}
