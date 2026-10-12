import type { GroupBase, OptionsOrGroups } from 'react-select'
import { GetFood } from '../Functions/FWG'

export type OptionType = {
	value: string
	label: string
	quantity: string
	quantity_unit: string
}

const sleep = (ms: number) =>
	new Promise((resolve) => {
		setTimeout(() => {
			resolve(undefined)
		}, ms)
	})

export const loadFoodOptions = async (
	search: string,
	prevOptions: OptionsOrGroups<OptionType, GroupBase<OptionType>>
) => {
	await sleep(1000)

	const page = Math.floor(prevOptions.length / 20) + 1

	try {
		const response: any = await GetFood({
			search,
			page,
			limit: 50,
		})

		const foodData = response.data
		const { remainingPages } = response.metadata.pagination
		
		const options = foodData.map((food: any) => ({
			value: food._id,
			label: food.food_name,
			quantity: food.quantity,
			quantity_unit: food.quantity_unit,
		}))
		
		return {
			options,
			hasMore: remainingPages > 0,
		}
	} catch (error) {
		console.error('Error fetching food:', error)
		return {
			options: [],
			hasMore: false,
		}
	}
}
