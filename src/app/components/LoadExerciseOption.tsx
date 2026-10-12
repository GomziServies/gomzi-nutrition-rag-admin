import type { GroupBase, OptionsOrGroups } from 'react-select'
import { GetExercise } from '../Functions/FWG'

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

export const loadExerciseOptions = async (
	search: string,
	prevOptions: OptionsOrGroups<OptionType, GroupBase<OptionType>>
) => {
	await sleep(1000)

	const page = Math.floor(prevOptions.length / 20) + 1

	try {
		const response: any = await GetExercise({
			search,
			page,
			limit: 20,
		})

		const exerciseData = response.data
		const { remainingPages } = response.metadata.pagination

		const options = exerciseData.map((exercise: any) => ({
			value: exercise._id,
			label: exercise.title,
		}))

		return {
			options,
			hasMore: remainingPages > 0,
		}
	} catch (error) {
		console.error('Error fetching Exercise:', error)
		return {
			options: [],
			hasMore: false,
		}
	}
}
