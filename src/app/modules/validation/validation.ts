// src/validation.ts
import Joi from 'joi'

export const invoiceSchema = Joi.object({
	email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
	invoice_number: Joi.number().required(),
	date: Joi.date().required(),
	name: Joi.string().required(),
	user_id: Joi.string(),
	duration: Joi.string().required(),
	duration_number: Joi.string().required(),
	branch_name: Joi.string().required(),
	billing_address: Joi.string(),
	mobile: Joi.string().required(),
	items: Joi.string().required(),
	payment_method: Joi.string().required(),
	bank_details: Joi.string(),
	net_amount: Joi.number().required(),
	paid_amount: Joi.number().required(),
	note: Joi.string().allow(''),
})

export const adminSchema = Joi.object({
	name: Joi.string().required(),
	email: Joi.string()
		.email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
		.required(),
	mobile: Joi.string().required(),
	type: Joi.string().required(),
	password: Joi.string().required(),
})

export const jobPlacementSchema = Joi.object({
	title: Joi.string().required(),
	contact_email: Joi.string()
		.email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
		.required(),
	contact_mobile: Joi.string().required(),
	contact_person: Joi.string().required(),
	company_name: Joi.string().required(),
	website: Joi.string().required(),
	vacancies: Joi.string().required(),
	end_date: Joi.string().required(),
	related_course: Joi.array().required(),
})

export const lectureSchema = Joi.object({
	title: Joi.string().required(),
	lecture_index: Joi.string().required(),
	video_url: Joi.string().required(),
	description: Joi.string().required(),
	related_course: Joi.array().required(),
})

export const employeeSchema = Joi.object({
	name: Joi.string().required().label('Name'),
	position: Joi.string().required().label('Position'),
	salary: Joi.number().required().label('Salary'),
	account_details: Joi.string().required().label('Account Details'),
	email: Joi.string()
		.email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
		.required()
		.label('Email'),
	mobile: Joi.string().required().label('Mobile'),
	address: Joi.string().required().label('Address'),
	photo: Joi.any().optional().label('Photo'),
	proof: Joi.any().optional().label('Proof'),
	document: Joi.any().optional().label('Document'),
	password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required().label('Password'),
})
