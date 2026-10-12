import type { GroupBase, OptionsOrGroups } from 'react-select'
import { GetStudents } from '../Functions/FGGroup'

export type OptionType = {
	value: string
	label: string
}

const sleep = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(() => {
			resolve(undefined)
		}, ms)
	})

export const loadUserOptionsFGIITStudents = async (
	search: string,
	prevOptions: OptionsOrGroups<OptionType, GroupBase<OptionType>>
) => {
	await sleep(1000)

	const page = Math.floor(prevOptions.length / 20) + 1

	try {
		const response: any = await GetStudents({
			search,
			page,
			limit: 50,
		})

		const userData = response.data
		const { remainingPages } = response.metadata.pagination

		const options = userData.map((user: any) => ({
			value: user._id,
			label: user.first_name + ' ' + user.last_name + ' - ' + (user.mobile || user.email),
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
