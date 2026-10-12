// @ts-nocheck
import { Column } from 'react-table'
import { User } from '../../core/_models'
import { UserActionsCell } from './UserActionsCell'
import { UserCustomHeader } from './UserCustomHeader'
import { UserInfoCell } from './UserInfoCell'
import { UserLastLoginCell } from './UserLastLoginCell'
import { UserSelectionCell } from './UserSelectionCell'
import { UserSelectionHeader } from './UserSelectionHeader'

const usersColumns: ReadonlyArray<Column<User>> = [
	{
		Header: (props) => <UserSelectionHeader tableProps={props} />,
		id: 'selection',
		Cell: ({ ...props }) => <UserSelectionCell id={props.data[props.row.index].id} />,
	},
	{
		Header: (props) => (
			<UserCustomHeader
				tableProps={props}
				title='Name'
				className='min-w-125px'
			/>
		),
		id: 'name',
		Cell: ({ ...props }) => <UserInfoCell user={props.data[props.row.index]} />,
	},
	{
		Header: (props) => (
			<UserCustomHeader
				tableProps={props}
				title='Email'
				className='min-w-125px'
			/>
		),
		id: 'email',
		Cell: ({ ...props }) => (
			<UserLastLoginCell last_login={props.data[props.row.index].last_login} />
		),
	},
	{
		Header: (props) => (
			<UserCustomHeader
				tableProps={props}
				title='Mobile No.'
				className='min-w-125px'
			/>
		),
		accessor: 'job_role',
	},
	{
		Header: (props) => (
			<UserCustomHeader
				tableProps={props}
				title='Role'
				className='min-w-125px'
			/>
		),
		accessor: 'role',
	},
	{
		Header: (props) => (
			<UserCustomHeader
				tableProps={props}
				title='Actions'
				className='min-w-100px'
			/>
		),
		id: 'actions',
		Cell: ({ ...props }) => <UserActionsCell id={props.data[props.row.index].id} />,
	},
]

export { usersColumns }
