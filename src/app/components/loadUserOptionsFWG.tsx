import type { GroupBase, OptionsOrGroups } from 'react-select'
import { GetUser } from '../Functions/FWG'
import UserImg from './300-1.jpg'

export type OptionType = {
	value: string
	label: string
	avatar?: string
}

const sleep = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(() => {
			resolve(undefined)
		}, ms)
	})

export const loadUserOptionsFWG = async (
	search: string,
	prevOptions: OptionsOrGroups<OptionType, GroupBase<OptionType>>
) => {
	await sleep(1000)

	const page = Math.floor(prevOptions.length / 20) + 1

	try {
		const response: any = await GetUser({
			search,
			page,
			limit: 50,
		})

		const userData = response.data
		const { remainingPages } = response.metadata.pagination

		const options = userData.map((user: any) => ({
			value: user._id,
			label: `${user.firstName} ${user.lastName} ${user.mobile ? `- ${user.mobile}` : ''} ${
				user.email ? `- ${user.email}` : ''
			}`,
			avatar: user.profile_image ? user.profile_image : UserImg,
		}))

		return {
			options,
			hasMore: remainingPages > 0,
		}
	} catch (error) {
		console.error('Error fetching User:', error)
		return {
			options: [],
			hasMore: false,
		}
	}
}
