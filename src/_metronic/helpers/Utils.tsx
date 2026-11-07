import axios, { HttpStatusCode } from 'axios'
import toast from 'react-hot-toast'


import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isBetween from 'dayjs/plugin/isBetween';
import minMax from 'dayjs/plugin/minMax';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(isBetween);
dayjs.extend(minMax);
dayjs.extend(duration);
dayjs.extend(isToday);

export const DayJS = dayjs;
export function successToast(text: string) {
	toast.success(text || 'Success')
}
export function errorToast(text: string) {
	toast.error(text || 'Something went wrong')
}

const clearAuthStorage = () => {
	localStorage.removeItem('auth_fg_group')
	localStorage.removeItem('auth_fwg')
	localStorage.removeItem('auth_gcs')
	localStorage.removeItem('admin')
	localStorage.removeItem('admin_type')
}

let isHandlingUnauthorized = false

const handleUnauthorized = (error: any) => {
	const statusCode = error?.response?.status ?? error?.response?.data?.status
	const message = String(error?.response?.data?.message || '')

	if (
		(statusCode === HttpStatusCode.Unauthorized || statusCode === 401) &&
		(message.includes('Invalid Token') || message.includes('Token is required'))
	) {
		if (!isHandlingUnauthorized && !window.location.pathname.includes('/auth/')) {
			isHandlingUnauthorized = true
			clearAuthStorage()
			window.location.replace('/auth/login')
		}
	}
}

export const APIGet = (
	APIEndpoint: string,
	headers?: object,
	queryString?: object,
	body?: object
): Promise<FGGroupAPIResponse | FWG_APIResponse> => {
	return new Promise((resolve, reject) => {
		axios
			.get(APIEndpoint, {
				headers: headers,
				params: queryString,
				data: body,
			})
			.then((responseJson) => {
				resolve(responseJson?.data)
			})
			.catch((error) => {
				handleUnauthorized(error)
				reject(error?.response?.data || error)
			})
	})
}

export const APIPost = (
	APIEndpoint: string,
	headers?: object,
	queryString?: object,
	body?: object
): Promise<FGGroupAPIResponse | FWG_APIResponse> => {
	return new Promise((resolve, reject) => {
		axios
			.post(APIEndpoint, body, {
				headers: headers,
				params: queryString,
				data: body,
			})
			.then((responseJson) => {
				resolve(responseJson?.data)
			})
			.catch((error) => {
				handleUnauthorized(error)
				reject(error?.response?.data || error)
			})
	})
}

export const APIPut = (
	APIEndpoint: string,
	headers?: object,
	queryString?: object,
	body?: object
): Promise<FGGroupAPIResponse | FWG_APIResponse> => {
	return new Promise((resolve, reject) => {
		axios
			.put(APIEndpoint, body, {
				headers: headers,
				params: queryString,
				data: body,
			})
			.then((responseJson) => {
				resolve(responseJson?.data)
			})
			.catch((error) => {
				handleUnauthorized(error)
				reject(error?.response?.data || error)
			})
	})
}

export const APIPatch = (
	APIEndpoint: string,
	headers?: object,
	queryString?: object,
	body?: object
): Promise<FGGroupAPIResponse | FWG_APIResponse> => {
	return new Promise((resolve, reject) => {
		axios
			.patch(APIEndpoint, body, {
				headers: headers,
				params: queryString,
				data: body,
			})
			.then((responseJson) => {
				resolve(responseJson?.data)
			})
			.catch((error) => {
				handleUnauthorized(error)
				reject(error?.response?.data || error)
			})
	})
}

export const APIDelete = (
	APIEndpoint: string,
	headers?: object,
	queryString?: object,
	body?: object
): Promise<FGGroupAPIResponse | FWG_APIResponse> => {
	return new Promise((resolve, reject) => {
		axios
			.delete(APIEndpoint, {
				headers: headers,
				params: queryString,
				data: body,
			})
			.then((responseJson) => {
				resolve(responseJson?.data)
			})
			.catch((error) => {
				handleUnauthorized(error)
				reject(error?.response?.data || error)
			})
	})
}
