// import invariant from 'tiny-invariant'
// import {createS3Bucket} from '~/utils/s3.server'

// const BUCKET_NAME = 'recipesharingclouds3'

// async function main() {
// 	const AWS_REGION = process.env.AWS_REGION

// 	invariant(AWS_REGION, 'AWS_REGION is not defined')
// 	invariant(BUCKET_NAME, 'BUCKET_NAME is not defined')

// 	await createS3Bucket({
// 		name: BUCKET_NAME,
// 		region: AWS_REGION,
// 	})
// }

// main()
// 	.then(() => console.log(`S3 bucket - "${BUCKET_NAME}" created 🚀`))
// 	.catch(e => {
// 		console.error(e)
// 		process.exit(1)
// 	})

import invariant from 'tiny-invariant'
import {createS3Bucket} from '~/utils/s3.server'

async function main(bucketName: string) {
	const AWS_REGION = process.env.AWS_REGION

	console.log('AWS_REGION', AWS_REGION)

	invariant(AWS_REGION, 'AWS_REGION is not defined')
	invariant(bucketName, 'BUCKET_NAME is not defined')

	await createS3Bucket({
		name: bucketName,
		region: AWS_REGION,
	})
}

const args = process.argv.slice(2)
const bucketArg = args.find(arg => arg.startsWith('-n='))

if (bucketArg) {
	const BUCKET_NAME = bucketArg.split('=')[1]
	main(BUCKET_NAME)
		.then(() => console.log(`S3 bucket - "${BUCKET_NAME}" created 🚀`))
		.catch(e => {
			console.error(e)
			process.exit(1)
		})
} else {
	console.log('No --name=Bname argument provided!')
	process.exit(1)
}
