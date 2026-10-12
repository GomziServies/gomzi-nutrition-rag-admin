import { configureStore } from '@reduxjs/toolkit'
import ProfileSlice from './Slices/ProfileSlice'

export const store = configureStore({
	reducer: {
		profileData: ProfileSlice,
	},
})

export type AppDispatch = typeof store.dispatch
