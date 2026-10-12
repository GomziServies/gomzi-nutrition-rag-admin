import { createSlice } from '@reduxjs/toolkit'
import { revertAll } from '../CommonFunctions'

const initialState = {
	step: 'overview',
	profileData: {},
}

export const profileSlice = createSlice({
	name: 'profileData',
	// `createSlice` will infer the state type from the `initialState` argument
	initialState,
	reducers: {
		changeProfileStep: (state, { payload }) => {
			state.step = payload
		},
		changeProfileData: (state, { payload }) => {
			state.profileData = payload
		},
	},
	extraReducers: (builder) => builder.addCase(revertAll, () => initialState),
})

export const { changeProfileStep, changeProfileData } = profileSlice.actions

export default profileSlice.reducer
