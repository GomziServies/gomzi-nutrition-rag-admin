declare module 'react-select' {
	import * as React from 'react'

	export type OptionType = any
	export type GroupBase<Option> = {
		options: readonly Option[]
		label?: string
		[key: string]: any
	}
	export type OptionsOrGroups<Option, Group extends GroupBase<Option>> = readonly (Option | Group)[]

	export interface ActionMeta<Option> {
		action: string
		option?: Option
		removedValue?: Option
		removedValues?: readonly Option[]
		name?: string
	}

	export interface Props<
		Option = any,
		IsMulti extends boolean = boolean,
		Group extends GroupBase<Option> = GroupBase<Option>
	> {
		[key: string]: any
	}

	export const components: {
		[key: string]: React.ComponentType<any>
	}

	export default class Select<
		Option = any,
		IsMulti extends boolean = false,
		Group extends GroupBase<Option> = GroupBase<Option>
	> extends React.Component<Props<Option, IsMulti, Group>> {}
}

declare module 'react-select/async' {
	import * as React from 'react'
	import Select from 'react-select'

	export default class AsyncSelect<Option = any, IsMulti extends boolean = false> extends React.Component<any> {}
}

declare module 'react-select-async-paginate' {
	import * as React from 'react'
	export const AsyncPaginate: React.ComponentType<any>
}
