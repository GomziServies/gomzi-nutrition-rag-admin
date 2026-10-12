import {
	faAddressBook,
	faCheckDouble,
	faChevronRight,
	faCircleNodes,
	faEdit,
	faFilter,
	faFolderOpen,
	faLayerGroup,
	faPaperPlane,
	faPlus,
	faSearch,
	faSitemap,
	faTrash,
	faUserGroup,
	faUsers,
	faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'
import { PageTitle } from '../../../../../_metronic/layout/core'
import InputField from '../../../../components/InputField'
import LengthMenu from '../../../../components/LengthMenu'
import SelectField from '../../../../components/SelectField'
import UsersListPagination from '../../../../components/TablePagination'
import {
	CreateAutomationContactGroup,
	GetAutomationBrands,
	GetAutomationContactGroups,
	GetAutomationContacts,
	RemoveAutomationContactGroup,
	UpdateAutomationContact,
	UpdateAutomationContactGroup,
} from '../../../../Functions/FGGroup/AutomationContacts'

type QuerySortOptions = 'asc' | 'desc'

interface APIResponse {
	status: number
	message?: string
	data?: any
	metadata?: any
}

interface Brand {
	_id: string
	brand_name: string
	status: boolean
	createdAt: string
	updatedAt: string
}

interface Group {
	_id: string
	group_name: string
	brand_id:
		| {
				_id: string
				brand_name: string
		  }
		| string
	createdAt: string
	updatedAt: string
}

interface Contact {
	_id: string
	full_name: string
	email: string
	phone_number: number
	brand_id: {
		_id: string
		brand_name: string
	}
	group_id: {
		_id: string
		group_name: string
	}
}

const GroupManagement: React.FC = () => {
	const adminType = localStorage.getItem('admin')
	const expectedBrandName =
		adminType === 'FWG'
			? 'FWG'
			: adminType === 'Gomzi_Nutrition' || adminType === 'Store'
			? 'Gomzi Nutrition'
			: 'Gomzi Life Science'

	React.useEffect(() => {
		const style = document.createElement('style')
		style.innerHTML = `
      /* ─── Hierarchy & Professional Styles ─── */

      .gm-page-header {
        background: linear-gradient(135deg, #1e1e2d 0%, #2d2d44 100%);
        border-radius: 16px;
        padding: 32px 36px;
        margin-bottom: 28px;
        position: relative;
        overflow: hidden;
      }
      .gm-page-header::after {
        content: '';
        position: absolute;
        top: -40%;
        right: -8%;
        width: 320px;
        height: 320px;
        background: rgba(255,255,255,0.03);
        border-radius: 50%;
      }
      .gm-page-header h1 {
        color: #fff;
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 6px;
      }
      .gm-page-header p {
        color: rgba(255,255,255,0.55);
        margin: 0;
        font-size: 0.92rem;
      }

      /* breadcrumb */
      .gm-breadcrumb {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 18px;
        font-size: 0.82rem;
        color: rgba(255,255,255,0.45);
      }
      .gm-breadcrumb .active {
        color: rgba(255,255,255,0.85);
        font-weight: 600;
      }

      /* Stat cards row */
      .gm-stats-row {
        display: flex;
        gap: 20px;
        margin-bottom: 28px;
        flex-wrap: wrap;
      }
      .gm-stat-card {
        flex: 1;
        min-width: 200px;
        background: #fff;
        border-radius: 14px;
        padding: 22px 26px;
        display: flex;
        align-items: center;
        gap: 18px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        border: 1px solid #f1f1f4;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .gm-stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.07);
      }
      .gm-stat-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
      }
      .gm-stat-icon.brands { background: rgba(99,102,241,0.1); color: #6366f1; }
      .gm-stat-icon.groups { background: rgba(16,185,129,0.1); color: #10b981; }
      .gm-stat-icon.contacts { background: rgba(245,158,11,0.1); color: #f59e0b; }
      .gm-stat-icon.selected { background: rgba(59,130,246,0.1); color: #3b82f6; }
      .gm-stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e1e2d;
        line-height: 1.2;
      }
      .gm-stat-label {
        font-size: 0.8rem;
        color: #a1a5b7;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Tab navigation */
      .gm-tabs {
        display: flex;
        gap: 6px;
        background: #f4f6fa;
        border-radius: 12px;
        padding: 5px;
        width: fit-content;
        margin-bottom: 0;
      }
      .gm-tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 22px;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: #7e8299;
        font-weight: 600;
        font-size: 0.88rem;
        cursor: pointer;
        transition: all 0.25s ease;
      }
      .gm-tab:hover {
        background: rgba(255,255,255,0.6);
        color: #3f4254;
      }
      .gm-tab.active {
        background: #fff;
        color: #1e1e2d;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }
      .gm-tab .tab-icon {
        font-size: 0.95rem;
      }
      .gm-tab .tab-badge {
        background: #e8e8ed;
        color: #7e8299;
        font-size: 0.72rem;
        padding: 2px 8px;
        border-radius: 20px;
        font-weight: 700;
      }
      .gm-tab.active .tab-badge {
        background: #3699FF;
        color: #fff;
      }

      /* Main content card */
      .gm-content-card {
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 2px 14px rgba(0,0,0,0.04);
        border: 1px solid #f1f1f4;
        overflow: hidden;
      }

      /* Toolbar */
      .gm-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 28px;
        border-bottom: 1px solid #f1f1f4;
        flex-wrap: wrap;
        gap: 14px;
      }
      .gm-toolbar-left {
        display: flex;
        align-items: center;
        gap: 14px;
        flex-wrap: wrap;
      }
      .gm-toolbar-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      /* Search input */
      .gm-search-wrapper {
        position: relative;
      }
      .gm-search-wrapper .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: #b5b5c3;
        font-size: 0.85rem;
      }
      .gm-search-wrapper input {
        padding: 9px 38px 9px 40px;
        border-radius: 10px;
        border: 1.5px solid #e4e6ef;
        background: #f9fafb;
        font-size: 0.88rem;
        width: 280px;
        transition: all 0.2s;
        outline: none;
      }
      .gm-search-wrapper input:focus {
        border-color: #3699FF;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(54,153,255,0.1);
      }
      .gm-search-wrapper .clear-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #b5b5c3;
        cursor: pointer;
        padding: 2px 6px;
        font-size: 0.8rem;
      }

      /* Brand filter chips */
      .gm-filter-section {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 16px 28px 16px;
        border-bottom: 1px solid #f1f1f4;
        flex-wrap: wrap;
      }
      .gm-filter-label {
        font-size: 0.8rem;
        font-weight: 600;
        color: #a1a5b7;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .gm-filter-chip {
        padding: 5px 14px;
        border-radius: 20px;
        border: 1.5px solid #e4e6ef;
        background: #fff;
        font-size: 0.82rem;
        font-weight: 600;
        color: #7e8299;
        cursor: pointer;
        transition: all 0.2s;
      }
      .gm-filter-chip:hover {
        border-color: #3699FF;
        color: #3699FF;
      }
      .gm-filter-chip.active {
        background: #3699FF;
        border-color: #3699FF;
        color: #fff;
      }

      /* Action buttons */
      .gm-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 9px 20px;
        border-radius: 10px;
        border: none;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;
      }
      .gm-btn-primary {
        background: #3699FF;
        color: #fff;
      }
      .gm-btn-primary:hover {
        background: #2684e0;
        box-shadow: 0 4px 12px rgba(54,153,255,0.3);
      }
      .gm-btn-success {
        background: #10b981;
        color: #fff;
      }
      .gm-btn-success:hover {
        background: #059669;
        box-shadow: 0 4px 12px rgba(16,185,129,0.3);
      }
      .gm-btn-outline {
        background: #fff;
        border: 1.5px solid #e4e6ef;
        color: #7e8299;
      }
      .gm-btn-outline:hover {
        border-color: #3699FF;
        color: #3699FF;
        background: rgba(54,153,255,0.04);
      }
      .gm-btn-danger-light {
        background: rgba(239,68,68,0.08);
        color: #ef4444;
      }
      .gm-btn-danger-light:hover {
        background: rgba(239,68,68,0.15);
      }
      .gm-btn-edit-light {
        background: rgba(245,158,11,0.08);
        color: #f59e0b;
      }
      .gm-btn-edit-light:hover {
        background: rgba(245,158,11,0.15);
      }
      .gm-btn-sm {
        padding: 6px 14px;
        font-size: 0.8rem;
      }

      /* Table styles */
      .gm-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      .gm-table thead th {
        background: #f9fafb;
        padding: 14px 18px;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.7px;
        color: #a1a5b7;
        border-bottom: 1px solid #f1f1f4;
        white-space: nowrap;
      }
      .gm-table thead th:first-child {
        padding-left: 28px;
      }
      .gm-table thead th:last-child {
        padding-right: 28px;
      }
      .gm-table tbody tr {
        transition: background 0.15s;
      }
      .gm-table tbody tr:hover {
        background: #f8f9fb !important;
      }
      .gm-table tbody tr.selected-row {
        background: rgba(54,153,255,0.04) !important;
      }
      .gm-table tbody td {
        padding: 16px 18px;
        border-bottom: 1px solid #f5f5f8;
        font-size: 0.88rem;
        color: #3f4254;
        vertical-align: middle;
      }
      .gm-table tbody td:first-child {
        padding-left: 28px;
      }
      .gm-table tbody td:last-child {
        padding-right: 28px;
      }

      /* Row number */
      .gm-row-num {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: #f4f6fa;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 700;
        color: #a1a5b7;
      }

      /* Entity icon/avatar */
      .gm-entity-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        flex-shrink: 0;
      }
      .gm-entity-icon.group-icon {
        background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05));
        color: #10b981;
      }
      .gm-entity-icon.contact-icon {
        background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.05));
        color: #6366f1;
      }

      /* Entity info */
      .gm-entity-name {
        font-weight: 700;
        color: #1e1e2d;
        font-size: 0.9rem;
        line-height: 1.3;
      }
      .gm-entity-sub {
        font-size: 0.78rem;
        color: #a1a5b7;
        margin-top: 2px;
      }

      /* Brand badge */
      .gm-brand-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        background: rgba(99,102,241,0.08);
        color: #6366f1;
      }
      .gm-group-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        background: rgba(16,185,129,0.08);
        color: #10b981;
      }
      .gm-na-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        background: #f4f6fa;
        color: #b5b5c3;
      }

      /* Date display */
      .gm-date {
        color: #7e8299;
        font-size: 0.84rem;
      }
      .gm-date-sub {
        font-size: 0.72rem;
        color: #b5b5c3;
      }

      /* Actions cell */
      .gm-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: flex-end;
      }
      .gm-action-btn {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.85rem;
      }
      .gm-action-btn.edit {
        background: rgba(245,158,11,0.08);
        color: #f59e0b;
      }
      .gm-action-btn.edit:hover {
        background: rgba(245,158,11,0.18);
        transform: scale(1.05);
      }
      .gm-action-btn.delete {
        background: rgba(239,68,68,0.08);
        color: #ef4444;
      }
      .gm-action-btn.delete:hover {
        background: rgba(239,68,68,0.18);
        transform: scale(1.05);
      }

      /* Checkbox styling */
      .gm-checkbox {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        border: 2px solid #d1d5db;
        appearance: none;
        cursor: pointer;
        transition: all 0.15s;
        position: relative;
      }
      .gm-checkbox:checked {
        background: #3699FF;
        border-color: #3699FF;
      }
      .gm-checkbox:checked::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
      }
      .gm-checkbox:hover {
        border-color: #3699FF;
      }

      /* Empty state */
      .gm-empty {
        text-align: center;
        padding: 60px 20px;
      }
      .gm-empty-icon {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        background: #f4f6fa;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: #d1d5db;
        margin-bottom: 18px;
      }
      .gm-empty h3 {
        color: #3f4254;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .gm-empty p {
        color: #a1a5b7;
        font-size: 0.88rem;
      }

      /* Loading */
      .gm-loading {
        text-align: center;
        padding: 50px 20px;
      }
      .gm-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f1f1f4;
        border-top-color: #3699FF;
        border-radius: 50%;
        animation: gm-spin 0.8s linear infinite;
        margin: 0 auto 14px;
      }
      @keyframes gm-spin {
        to { transform: rotate(360deg); }
      }

      /* Selection bar */
      .gm-selection-bar {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 28px;
        background: linear-gradient(135deg, rgba(54,153,255,0.06), rgba(54,153,255,0.02));
        border-bottom: 1px solid rgba(54,153,255,0.1);
      }
      .gm-selection-count {
        font-size: 0.85rem;
        color: #3699FF;
        font-weight: 600;
      }

      /* Pagination wrapper */
      .gm-pagination {
        padding: 18px 28px;
        border-top: 1px solid #f1f1f4;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .gm-pagination-info {
        font-size: 0.82rem;
        color: #a1a5b7;
      }

      /* Modal overrides */
      .gm-modal .modal-content {
        border-radius: 18px;
        border: none;
        box-shadow: 0 20px 60px rgba(0,0,0,0.12);
        overflow: hidden;
      }
      .gm-modal-header {
        background: linear-gradient(135deg, #1e1e2d 0%, #2d2d44 100%);
        padding: 28px 32px;
        position: relative;
      }
      .gm-modal-header h2 {
        color: #fff;
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 4px;
      }
      .gm-modal-header p {
        color: rgba(255,255,255,0.5);
        font-size: 0.85rem;
        margin: 0;
      }
      .gm-modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(255,255,255,0.1);
        border: none;
        color: rgba(255,255,255,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 1rem;
      }
      .gm-modal-close:hover {
        background: rgba(255,255,255,0.2);
        color: #fff;
      }
      .gm-modal-body {
        padding: 28px 32px;
      }
      .gm-modal-footer {
        padding: 0 32px 28px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      /* Form elements in modal */
      .gm-form-group {
        margin-bottom: 20px;
      }
      .gm-form-label {
        display: block;
        font-size: 0.82rem;
        font-weight: 700;
        color: #3f4254;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Hierarchy visual connector */
      .gm-hierarchy-path {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
      .gm-hierarchy-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .gm-hierarchy-line {
        width: 20px;
        height: 2px;
        background: #e4e6ef;
        flex-shrink: 0;
      }

      /* Contact phone/email styles */
      .gm-contact-detail {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.85rem;
        color: #5e6278;
      }
      .gm-contact-detail-icon {
        color: #b5b5c3;
        font-size: 0.75rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .gm-page-header { padding: 22px 20px; }
        .gm-stats-row { gap: 12px; }
        .gm-stat-card { min-width: 150px; padding: 16px 18px; }
        .gm-toolbar { padding: 16px 18px; }
        .gm-search-wrapper input { width: 200px; }
        .gm-filter-section { padding: 0 18px 12px; }
        .gm-table thead th:first-child,
        .gm-table tbody td:first-child { padding-left: 18px; }
        .gm-table thead th:last-child,
        .gm-table tbody td:last-child { padding-right: 18px; }
      }
    `
		document.head.appendChild(style)

		return () => {
			document.head.removeChild(style)
		}
	}, [])

	const [allBrands, setAllBrands] = useState<Brand[]>([])
	const [loadingBrands, setLoadingBrands] = useState<boolean>(true)
	const [brandTotalCount, setBrandTotalCount] = useState<number>(0)

	const [groups, setGroups] = useState<Group[]>([])
	const [allGroups, setAllGroups] = useState<Group[]>([])
	const [groupTotalCount, setGroupTotalCount] = useState<number>(0)
	const [loadingGroups, setLoadingGroups] = useState<boolean>(true)

	const [contacts, setContacts] = useState<Contact[]>([])
	const [contactTotalCount, setContactTotalCount] = useState<number>(0)
	const [loadingContacts, setLoadingContacts] = useState<boolean>(true)

	const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])

	const [showGroupModal, setShowGroupModal] = useState<boolean>(false)
	const [showContactAssignmentModal, setShowContactAssignmentModal] = useState<boolean>(false)

	const [groupAddData, setGroupAddData] = useState<Partial<Group>>({})
	const [selectedBrandId, setSelectedBrandId] = useState<string>('')
	const [selectedContacts, setSelectedContacts] = useState<string[]>([])
	const [selectedGroupIdForAssignment, setSelectedGroupIdForAssignment] = useState<string>('')
	const [contactBrandFilter, setContactBrandFilter] = useState<string>('')

	const [currentPage, setCurrentPage] = useState(1)
	const [rowsPerPage, setRowsPerPage] = useState(10)
	const [searchTerm, setSearchTerm] = useState('')
	const [sort, setSort] = useState('createdAt')
	const [sortOrder, setSortOrder] = useState<QuerySortOptions>('desc')

	const [activeTab, setActiveTab] = useState<'groups' | 'contacts'>('groups')

	const fetchBrands = async () => {
		setLoadingBrands(true)
		try {
			const response: APIResponse = await GetAutomationBrands({
				page: currentPage,
				limit: rowsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			})
			if (response.status === 200) {
				const brandsData = response.data?.automation_brands || []
				setAllBrands(Array.isArray(brandsData) ? brandsData : [])
				setBrandTotalCount(response.data?.pagination?.totalDocs || 0)
			}
		} catch (error) {
			console.error('Error fetching brands:', error)
		} finally {
			setLoadingBrands(false)
		}
	}

	const fetchGroups = async () => {
		setLoadingGroups(true)
		try {
			const query: any = {
				page: currentPage,
				limit: rowsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			}
			if (contactBrandFilter) query.brand_id = contactBrandFilter
			const response: APIResponse = await GetAutomationContactGroups(query)
			if (response.status === 200) {
				const groupsData = response.data?.automation_groups || response.data || []
				setGroups(Array.isArray(groupsData) ? groupsData : [])
				setAllGroups(Array.isArray(groupsData) ? groupsData : [])
				setGroupTotalCount(response.data?.pagination?.totalDocs || 0)
			}
		} catch (error) {
			console.error('Error fetching groups:', error)
		} finally {
			setLoadingGroups(false)
		}
	}

	const fetchContacts = async () => {
		setLoadingContacts(true)
		try {
			const query: any = {
				page: currentPage,
				limit: rowsPerPage,
				search: searchTerm,
				sort,
				sortOrder,
			}
			if (contactBrandFilter) query.brand_id = contactBrandFilter
			const response: APIResponse = await GetAutomationContacts(query)
			if (response.status === 200) {
				const contactsData = response.data?.automation_contacts || response.data || []
				const fetchedContacts = Array.isArray(contactsData) ? contactsData : []
				setContacts(fetchedContacts)
				setFilteredContacts(fetchedContacts)
				let totalDocs = 0
				if (response.metadata?.pagination?.totalDocs !== undefined) {
					totalDocs = response.metadata.pagination.totalDocs
				} else if (response.data?.pagination?.totalDocs !== undefined) {
					totalDocs = response.data.pagination.totalDocs
				} else if (response.data?.totalDocs !== undefined) {
					totalDocs = response.data.totalDocs
				} else if (response.data?.length !== undefined) {
					totalDocs = response.data.length
				} else {
					totalDocs = response.data?.meta?.total || response.data?.total || 0
				}
				setContactTotalCount(totalDocs)
			}
		} catch (error) {
			console.error('Error fetching contacts:', error)
		} finally {
			setLoadingContacts(false)
		}
	}

	const handleGroupInputChange = (event: any) => {
		const { name, value } = event.target
		setGroupAddData((prevData) => ({ ...prevData, [name]: value } as Partial<Group>))
	}

	const handleCreateGroup = async () => {
		if (!groupAddData.group_name || !groupAddData.brand_id) {
			toast.error('Group name and brand are required')
			return
		}
		try {
			const response: APIResponse = await CreateAutomationContactGroup({
				group_name: groupAddData.group_name as string,
				brand_id:
					typeof groupAddData.brand_id === 'object'
						? (groupAddData.brand_id as any)._id
						: (groupAddData.brand_id as string),
			})
			if (response.status === 200) {
				toast.success('Group created successfully')
				setGroupAddData({})
				setShowGroupModal(false)
				fetchGroups()
			} else {
				toast.error(response.message || 'Error creating group')
			}
		} catch (error) {
			console.error('Error creating group:', error)
			toast.error('Error creating group')
		}
	}

	const handleUpdateGroup = async (groupId: string) => {
		if (!groupAddData.group_name) {
			toast.error('Group name is required')
			return
		}
		try {
			const response: APIResponse = await UpdateAutomationContactGroup({
				group_id: groupId,
				group_name: groupAddData.group_name as string,
				brand_id:
					typeof groupAddData.brand_id === 'object'
						? (groupAddData.brand_id as any)._id
						: (groupAddData.brand_id as string),
			})
			if (response.status === 200) {
				toast.success('Group updated successfully')
				setGroupAddData({})
				setShowGroupModal(false)
				fetchGroups()
			} else {
				toast.error(response.message || 'Error updating group')
			}
		} catch (error) {
			console.error('Error updating group:', error)
			toast.error('Error updating group')
		}
	}

	const handleDeleteGroup = async (groupId: string) => {
		const result = await Swal.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes, delete it!',
		})
		if (!result.isConfirmed) return
		try {
			const response: APIResponse = await RemoveAutomationContactGroup({ group_id: groupId })
			if (response.status === 200) {
				toast.success('Group deleted successfully')
				fetchGroups()
			} else {
				toast.error(response.message || 'Error deleting group')
			}
		} catch (error: any) {
			console.error('Error deleting group:', error)
			toast.error(error?.response?.data?.message || error.message || 'Error deleting group')
		}
	}

	const handleAssignContactsToGroup = async (groupId: string) => {
		if (!groupId || selectedContacts.length === 0) {
			toast.error('Please select a group and at least one contact')
			return
		}
		try {
			for (const contactId of selectedContacts) {
				await UpdateAutomationContact({ contact_id: contactId, group_id: groupId })
			}
			toast.success('Contacts assigned to group successfully')
			setSelectedContacts([])
			setSelectedGroupIdForAssignment('')
			setShowContactAssignmentModal(false)
			fetchContacts()
		} catch (error) {
			console.error('Error assigning contacts to group:', error)
			toast.error('Error assigning contacts to group')
		}
	}

	const handleContactSelection = (contactId: string) => {
		setSelectedContacts((prev) =>
			prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
		)
	}

	const handleSelectAllContacts = () => {
		if (selectedContacts.length === filteredContacts.length) {
			setSelectedContacts([])
		} else {
			setSelectedContacts(filteredContacts.map((contact) => contact._id))
		}
	}

	const setDefaultBrandFilter = () => {
		const activeBrand = allBrands.find((brand) => brand.brand_name === expectedBrandName)
		if (activeBrand) setContactBrandFilter(activeBrand._id)
	}

	useEffect(() => {
		if (activeTab === 'groups') fetchGroups()
		else if (activeTab === 'contacts') fetchContacts()
	}, [activeTab, currentPage, rowsPerPage, searchTerm, sort, sortOrder, contactBrandFilter])

	useEffect(() => {
		if (allBrands.length > 0 && !contactBrandFilter) setDefaultBrandFilter()
	}, [allBrands, contactBrandFilter])

	useEffect(() => {
		fetchBrands()
	}, [])

	useEffect(() => {
		setCurrentPage(1)
	}, [searchTerm])

	useEffect(() => {
		setFilteredContacts(contacts)
	}, [contacts])

	const brandOptions = Array.isArray(allBrands)
		? allBrands.map((brand) => `${brand.brand_name} (${brand._id})`)
		: []

	const groupOptions = Array.isArray(allGroups)
		? allGroups
				.filter((group) => {
					const brandName =
						typeof group.brand_id === 'object'
							? group.brand_id.brand_name
							: Array.isArray(allBrands)
							? allBrands.find((b) => b._id === group.brand_id)?.brand_name || ''
							: ''
					return brandName === expectedBrandName
				})
				.map(
					(group) =>
						`${group.group_name} (${group._id}) - ${
							typeof group.brand_id === 'object'
								? group.brand_id.brand_name
								: Array.isArray(allBrands)
								? allBrands.find((b) => b._id === group.brand_id)?.brand_name || 'Unknown Brand'
								: 'Unknown Brand'
						}`
				)
		: []

	const getBrandIdFromOption = (option: string) => {
		if (!option) return ''
		const match = option.match(/\(([^)]+)\)$/)
		return match ? match[1] : ''
	}

	const getGroupIdFromOption = (option: string) => {
		if (!option) return ''
		const match = option.match(/\(([^)]+)\)/g)
		if (match && match.length > 0) {
			const lastMatch = match[match.length - 1]
			return lastMatch.replace(/[()]/g, '')
		}
		return ''
	}

	const getBrandOptionFromId = (id: string) => {
		const brand = Array.isArray(allBrands) ? allBrands.find((b) => b._id === id) : undefined
		return brand ? `${brand.brand_name} (${brand._id})` : ''
	}

	const getGroupOptionFromId = (id: string) => {
		if (!id) return ''
		const FGIITGroups = Array.isArray(allGroups)
			? allGroups.filter((group) => {
					const brandName =
						typeof group.brand_id === 'object'
							? group.brand_id.brand_name
							: Array.isArray(allBrands)
							? allBrands.find((b) => b._id === group.brand_id)?.brand_name || ''
							: ''
					return brandName === 'Gomzi Life Science'
			  })
			: []
		const group = FGIITGroups.find((g) => g._id === id)
		return group
			? `${group.group_name} (${group._id}) - ${
					typeof group.brand_id === 'object'
						? group.brand_id.brand_name
						: Array.isArray(allBrands)
						? allBrands.find((b) => b._id === group.brand_id)?.brand_name || 'Unknown Brand'
						: 'Unknown Brand'
			  }`
			: ''
	}

	const getBrandName = (group: Group) => {
		if (typeof group.brand_id === 'object' && group.brand_id) {
			return group.brand_id.brand_name
		}
		if (Array.isArray(allBrands) && allBrands.length > 0) {
			return allBrands.find((b) => b._id === group.brand_id)?.brand_name || 'N/A'
		}
		return 'N/A'
	}

	const getActiveBrandName = () => {
		if (!contactBrandFilter) return 'All Brands'
		const brand = allBrands.find((b) => b._id === contactBrandFilter)
		return brand ? brand.brand_name : 'All Brands'
	}

	const formatDate = (dateStr: string) => {
		const d = new Date(dateStr)
		return {
			date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
			time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
		}
	}

	return (
		<>
			<PageTitle breadcrumbs={[]}>Groups & Contact Management</PageTitle>

			{/* ─── Page Header ─── */}
			<div className='gm-page-header'>
				<div className='gm-breadcrumb'>
					<FontAwesomeIcon icon={faSitemap} />
					<span>Automation</span>
					<FontAwesomeIcon
						icon={faChevronRight}
						style={{ fontSize: '0.6rem' }}
					/>
					<span className='active'>{activeTab === 'groups' ? 'Groups' : 'Contacts'}</span>
					{contactBrandFilter && (
						<>
							<FontAwesomeIcon
								icon={faChevronRight}
								style={{ fontSize: '0.6rem' }}
							/>
							<span className='active'>{getActiveBrandName()}</span>
						</>
					)}
				</div>
				<h1>
					<FontAwesomeIcon
						icon={faCircleNodes}
						className='me-3'
						style={{ opacity: 0.7 }}
					/>
					Groups & Contact Management
				</h1>
				<p>Manage your automation groups, assign contacts, and organize your outreach hierarchy.</p>
			</div>

			{/* ─── Stats Row ─── */}
			<div className='gm-stats-row'>
				{/* Total Brands - commented out */}
				{/* <div className='gm-stat-card'>
					<div className='gm-stat-icon brands'>
						<FontAwesomeIcon icon={faLayerGroup} />
					</div>
					<div>
						<div className='gm-stat-value'>{allBrands.length}</div>
						<div className='gm-stat-label'>Total Brands</div>
					</div>
				</div> */}
				{/* Total Groups - commented out */}
				{/* <div className='gm-stat-card'>
					<div className='gm-stat-icon groups'>
						<FontAwesomeIcon icon={faUserGroup} />
					</div>
					<div>
						<div className='gm-stat-value'>{groupTotalCount}</div>
						<div className='gm-stat-label'>Total Groups</div>
					</div>
				</div> */}
				{/* Total Contacts - commented out */}
				{/* <div className='gm-stat-card'>
					<div className='gm-stat-icon contacts'>
						<FontAwesomeIcon icon={faAddressBook} />
					</div>
					<div>
						<div className='gm-stat-value'>{contactTotalCount}</div>
						<div className='gm-stat-label'>Total Contacts</div>
					</div>
				</div> */}
				{activeTab === 'contacts' && selectedContacts.length > 0 && (
					<div className='gm-stat-card'>
						<div className='gm-stat-icon selected'>
							<FontAwesomeIcon icon={faCheckDouble} />
						</div>
						<div>
							<div className='gm-stat-value'>{selectedContacts.length}</div>
							<div className='gm-stat-label'>Selected</div>
						</div>
					</div>
				)}
			</div>

			{/* ─── Main Content Card ─── */}
			<div className='gm-content-card'>
				{/* ─── Toolbar ─── */}
				<div className='gm-toolbar'>
					<div className='gm-toolbar-left'>
						{/* Tabs */}
						<div className='gm-tabs'>
							<button
								className={`gm-tab ${activeTab === 'groups' ? 'active' : ''}`}
								onClick={() => {
									setActiveTab('groups')
									setCurrentPage(1)
									setSearchTerm('')
									setSelectedContacts([])
								}}>
								<FontAwesomeIcon
									icon={faUsers}
									className='tab-icon'
								/>
								<span>Groups</span>
								{/* <span className='tab-badge'>{groupTotalCount}</span> */}
							</button>
							<button
								className={`gm-tab ${activeTab === 'contacts' ? 'active' : ''}`}
								onClick={() => {
									setActiveTab('contacts')
									setCurrentPage(1)
									setSearchTerm('')
								}}>
								<FontAwesomeIcon
									icon={faAddressBook}
									className='tab-icon'
								/>
								<span>Contacts</span>
								{/* <span className='tab-badge'>{contactTotalCount}</span> */}
							</button>
						</div>

						{/* Search */}
						<div className='gm-search-wrapper'>
							<FontAwesomeIcon
								icon={faSearch}
								className='search-icon'
							/>
							<input
								type='text'
								placeholder={`Search ${activeTab}...`}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
							{searchTerm && (
								<button
									className='clear-btn'
									onClick={() => setSearchTerm('')}>
									<FontAwesomeIcon icon={faXmark} />
								</button>
							)}
						</div>

						{/* Rows per page */}
						<LengthMenu
							expenseData={activeTab === 'groups' ? groups : filteredContacts}
							handleItemsPerPageChange={(value) => {
								setRowsPerPage(value)
								setCurrentPage(1)
							}}
						/>
					</div>

					<div className='gm-toolbar-right'>
						{activeTab === 'groups' && (
							<button
								className='gm-btn gm-btn-primary'
								onClick={() => {
									setGroupAddData({})
									setShowGroupModal(true)
								}}>
								<FontAwesomeIcon icon={faPlus} />
								Add Group
							</button>
						)}

						{activeTab === 'contacts' && selectedContacts.length > 0 && (
							<button
								className='gm-btn gm-btn-success'
								onClick={async () => {
									const query: any = {
										page: 1,
										limit: 100,
										search: '',
										sort,
										sortOrder,
									}
									const response: APIResponse = await GetAutomationContactGroups(query)
									if (response.status === 200) {
										const groupsData = response.data?.automation_groups || response.data || []
										setAllGroups(Array.isArray(groupsData) ? groupsData : [])
									}
									setShowContactAssignmentModal(true)
								}}>
								<FontAwesomeIcon icon={faPaperPlane} />
								Assign to Group ({selectedContacts.length})
							</button>
						)}
					</div>
				</div>

				{/* ─── Brand Filter Chips ─── */}
				<div className='gm-filter-section'>
					<div className='gm-filter-label'>
						<FontAwesomeIcon icon={faFilter} />
						Brand:
					</div>
					<button
						className={`gm-filter-chip ${!contactBrandFilter ? 'active' : ''}`}
						onClick={() => {
							setContactBrandFilter('')
							setCurrentPage(1)
						}}>
						All
					</button>
					{Array.isArray(allBrands) &&
						allBrands.map((brand) => (
							<button
								key={brand._id}
								className={`gm-filter-chip ${contactBrandFilter === brand._id ? 'active' : ''}`}
								onClick={() => {
									setContactBrandFilter(brand._id)
									setCurrentPage(1)
								}}>
								{brand.brand_name}
							</button>
						))}
				</div>

				{/* ─── Selection Bar ─── */}
				{activeTab === 'contacts' && selectedContacts.length > 0 && (
					<div className='gm-selection-bar'>
						<FontAwesomeIcon
							icon={faCheckDouble}
							style={{ color: '#3699FF' }}
						/>
						<span className='gm-selection-count'>
							{selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
						</span>
						<button
							className='gm-btn gm-btn-sm gm-btn-outline'
							onClick={() => setSelectedContacts([])}>
							<FontAwesomeIcon icon={faXmark} />
							Clear
						</button>
					</div>
				)}

				{/* ─── Groups Table ─── */}
				{activeTab === 'groups' && (
					<>
						{loadingGroups ? (
							<div className='gm-loading'>
								<div className='gm-spinner'></div>
								<p style={{ color: '#a1a5b7', fontSize: '0.9rem' }}>Loading groups...</p>
							</div>
						) : Array.isArray(groups) && groups.length === 0 ? (
							<div className='gm-empty'>
								<div className='gm-empty-icon'>
									<FontAwesomeIcon icon={faFolderOpen} />
								</div>
								<h3>No Groups Found</h3>
								<p>Create your first group to start organizing contacts.</p>
								<button
									className='gm-btn gm-btn-primary mt-3'
									onClick={() => {
										setGroupAddData({})
										setShowGroupModal(true)
									}}>
									<FontAwesomeIcon icon={faPlus} />
									Create Group
								</button>
							</div>
						) : (
							<table className='gm-table'>
								<thead>
									<tr>
										<th style={{ width: '60px' }}>#</th>
										<th>Group Name</th>
										<th>Brand</th>
										<th>Created</th>
										<th style={{ textAlign: 'right' }}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{groups.map((group, index) => {
										const brandName = getBrandName(group)
										const { date, time } = formatDate(group.createdAt)
										return (
											<tr key={group._id}>
												<td>
													<span className='gm-row-num'>
														{(currentPage - 1) * rowsPerPage + index + 1}
													</span>
												</td>
												<td>
													<div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
														<div className='gm-entity-icon group-icon'>
															<FontAwesomeIcon icon={faUsers} />
														</div>
														<div>
															<div className='gm-entity-name'>{group.group_name}</div>
															<div
																className='gm-hierarchy-path'
																style={{ marginTop: '4px' }}>
																<div
																	className='gm-hierarchy-dot'
																	style={{ background: '#6366f1' }}
																/>
																<div className='gm-hierarchy-line' />
																<span style={{ fontSize: '0.75rem', color: '#a1a5b7' }}>
																	{brandName}
																</span>
																<FontAwesomeIcon
																	icon={faChevronRight}
																	style={{ fontSize: '0.5rem', color: '#d1d5db' }}
																/>
																<div
																	className='gm-hierarchy-dot'
																	style={{ background: '#10b981' }}
																/>
																<span style={{ fontSize: '0.75rem', color: '#a1a5b7' }}>
																	{group.group_name}
																</span>
															</div>
														</div>
													</div>
												</td>
												<td>
													<span className='gm-brand-badge'>
														<FontAwesomeIcon
															icon={faLayerGroup}
															style={{ fontSize: '0.7rem' }}
														/>
														{brandName}
													</span>
												</td>
												<td>
													<div className='gm-date'>{date}</div>
													<div className='gm-date-sub'>{time}</div>
												</td>
												<td>
													<div className='gm-actions'>
														<button
															className='gm-action-btn edit'
															title='Edit Group'
															onClick={() => {
																setGroupAddData(group)
																setShowGroupModal(true)
															}}>
															<FontAwesomeIcon icon={faEdit} />
														</button>
														<button
															className='gm-action-btn delete'
															title='Delete Group'
															onClick={() => handleDeleteGroup(group._id)}>
															<FontAwesomeIcon icon={faTrash} />
														</button>
													</div>
												</td>
											</tr>
										)
									})}
								</tbody>
							</table>
						)}

						{/* Groups Pagination */}
						{!loadingGroups && groupTotalCount > rowsPerPage && (
							<div className='gm-pagination'>
								<div className='gm-pagination-info'>
									Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
									{Math.min(currentPage * rowsPerPage, groupTotalCount)} of {groupTotalCount} groups
								</div>
								<UsersListPagination
									currentPage={currentPage}
									totalPages={Math.ceil(groupTotalCount / rowsPerPage)}
									onPageChange={(page) => setCurrentPage(page)}
								/>
							</div>
						)}
					</>
				)}

				{/* ─── Contacts Table ─── */}
				{activeTab === 'contacts' && (
					<>
						{loadingContacts ? (
							<div className='gm-loading'>
								<div className='gm-spinner'></div>
								<p style={{ color: '#a1a5b7', fontSize: '0.9rem' }}>Loading contacts...</p>
							</div>
						) : Array.isArray(filteredContacts) && filteredContacts.length === 0 ? (
							<div className='gm-empty'>
								<div className='gm-empty-icon'>
									<FontAwesomeIcon icon={faAddressBook} />
								</div>
								<h3>No Contacts Found</h3>
								<p>No contacts match your current search or filter criteria.</p>
							</div>
						) : (
							<table className='gm-table'>
								<thead>
									<tr>
										<th style={{ width: '60px' }}>#</th>
										<th style={{ width: '50px' }}>
											<input
												type='checkbox'
												className='gm-checkbox'
												checked={
													selectedContacts.length === filteredContacts.length &&
													filteredContacts.length > 0
												}
												onChange={handleSelectAllContacts}
											/>
										</th>
										<th>Contact</th>
										<th>Phone</th>
										<th>Email</th>
										<th>Brand</th>
										<th>Group</th>
									</tr>
								</thead>
								<tbody>
									{filteredContacts.map((contact, index) => (
										<tr
											key={contact._id}
											className={selectedContacts.includes(contact._id) ? 'selected-row' : ''}>
											<td>
												<span className='gm-row-num'>
													{(currentPage - 1) * rowsPerPage + index + 1}
												</span>
											</td>
											<td>
												<input
													type='checkbox'
													className='gm-checkbox'
													checked={selectedContacts.includes(contact._id)}
													onChange={() => handleContactSelection(contact._id)}
												/>
											</td>
											<td>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '14px',
													}}>
													<div className='gm-entity-icon contact-icon'>
														<FontAwesomeIcon icon={faUsers} />
													</div>
													<div>
														<div className='gm-entity-name'>{contact.full_name}</div>
														<div className='gm-entity-sub'>{contact.email}</div>
													</div>
												</div>
											</td>
											<td>
												<div className='gm-contact-detail'>
													<span className='gm-contact-detail-icon'>📱</span>
													{contact.phone_number}
												</div>
											</td>
											<td>
												<div className='gm-contact-detail'>
													<span className='gm-contact-detail-icon'>✉️</span>
													{contact.email}
												</div>
											</td>
											<td>
												{contact.brand_id?.brand_name ? (
													<span className='gm-brand-badge'>
														<FontAwesomeIcon
															icon={faLayerGroup}
															style={{ fontSize: '0.7rem' }}
														/>
														{contact.brand_id.brand_name}
													</span>
												) : (
													<span className='gm-na-badge'>N/A</span>
												)}
											</td>
											<td>
												{contact.group_id?.group_name ? (
													<span className='gm-group-badge'>
														<FontAwesomeIcon
															icon={faUserGroup}
															style={{ fontSize: '0.7rem' }}
														/>
														{contact.group_id.group_name}
													</span>
												) : (
													<span className='gm-na-badge'>Unassigned</span>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}

						{/* Contacts Pagination */}
						{!loadingContacts && contactTotalCount > rowsPerPage && (
							<div className='gm-pagination'>
								<div className='gm-pagination-info'>
									Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
									{Math.min(currentPage * rowsPerPage, contactTotalCount)} of {contactTotalCount}{' '}
									contacts
								</div>
								<UsersListPagination
									currentPage={currentPage}
									totalPages={Math.ceil(contactTotalCount / rowsPerPage)}
									onPageChange={(page) => setCurrentPage(page)}
								/>
							</div>
						)}
					</>
				)}
			</div>

			{/* ─── Group Modal ─── */}
			<Modal
				centered
				show={showGroupModal}
				onHide={() => {
					setGroupAddData({})
					setShowGroupModal(false)
				}}
				dialogClassName='gm-modal'>
				<div style={{ borderRadius: '18px', overflow: 'hidden' }}>
					<div className='gm-modal-header'>
						<button
							className='gm-modal-close'
							onClick={() => {
								setGroupAddData({})
								setShowGroupModal(false)
							}}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
						<h2>
							<FontAwesomeIcon
								icon={groupAddData._id ? faEdit : faPlus}
								className='me-2'
								style={{ opacity: 0.7 }}
							/>
							{groupAddData._id ? 'Update Group' : 'Create New Group'}
						</h2>
						<p>
							{groupAddData._id
								? 'Modify the group details below'
								: 'Fill in the details to create a new group'}
						</p>
					</div>

					<div className='gm-modal-body'>
						<div className='gm-form-group'>
							<InputField
								placeholder='Enter group name'
								type='text'
								className='col-12 fv-row mb-7'
								name='group_name'
								label='Group Name'
								htmlFor='group_name'
								value={groupAddData.group_name || ''}
								onChange={handleGroupInputChange}
							/>
						</div>

						<div className='gm-form-group'>
							<SelectField
								className='col-12 fv-row mb-7'
								name='brand_id'
								label='Brand'
								htmlFor='brand_id'
								value={getBrandOptionFromId(
									typeof groupAddData.brand_id === 'object'
										? (groupAddData.brand_id as any)._id
										: (groupAddData.brand_id as string)
								)}
								onChange={(e) => {
									const selectedBrandId = getBrandIdFromOption(e.target.value)
									setGroupAddData(
										(prev) =>
											({
												...prev,
												brand_id: selectedBrandId,
											} as Partial<Group>)
									)
								}}
								options={[...brandOptions]}
								disabled={loadingBrands}
							/>
						</div>

						{/* Hierarchy preview */}
						{groupAddData.group_name && groupAddData.brand_id && (
							<div
								style={{
									background: '#f9fafb',
									borderRadius: '12px',
									padding: '16px 20px',
									marginTop: '8px',
								}}>
								<div
									style={{
										fontSize: '0.78rem',
										fontWeight: 700,
										color: '#a1a5b7',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
										marginBottom: '10px',
									}}>
									Hierarchy Preview
								</div>
								<div className='gm-hierarchy-path'>
									<div
										className='gm-hierarchy-dot'
										style={{ background: '#6366f1', width: 10, height: 10 }}
									/>
									<span
										style={{
											fontSize: '0.85rem',
											fontWeight: 600,
											color: '#6366f1',
										}}>
										{getBrandOptionFromId(
											typeof groupAddData.brand_id === 'object'
												? (groupAddData.brand_id as any)._id
												: (groupAddData.brand_id as string)
										).split(' (')[0] || 'Brand'}
									</span>
									<div className='gm-hierarchy-line' />
									<FontAwesomeIcon
										icon={faChevronRight}
										style={{ fontSize: '0.5rem', color: '#d1d5db' }}
									/>
									<div className='gm-hierarchy-line' />
									<div
										className='gm-hierarchy-dot'
										style={{ background: '#10b981', width: 10, height: 10 }}
									/>
									<span
										style={{
											fontSize: '0.85rem',
											fontWeight: 600,
											color: '#10b981',
										}}>
										{groupAddData.group_name}
									</span>
								</div>
							</div>
						)}
					</div>

					<div className='gm-modal-footer'>
						<button
							className='gm-btn gm-btn-outline'
							onClick={() => {
								setGroupAddData({})
								setShowGroupModal(false)
							}}>
							Cancel
						</button>
						<button
							className='gm-btn gm-btn-primary'
							onClick={() => {
								if (groupAddData._id) {
									handleUpdateGroup(groupAddData._id)
								} else {
									handleCreateGroup()
								}
							}}>
							<FontAwesomeIcon icon={groupAddData._id ? faEdit : faPlus} />
							{groupAddData._id ? 'Update Group' : 'Create Group'}
						</button>
					</div>
				</div>
			</Modal>

			{/* ─── Contact Assignment Modal ─── */}
			<Modal
				centered
				show={showContactAssignmentModal}
				onHide={() => {
					setShowContactAssignmentModal(false)
					setSelectedGroupIdForAssignment('')
				}}
				dialogClassName='gm-modal'>
				<div style={{ borderRadius: '18px', overflow: 'hidden' }}>
					<div className='gm-modal-header'>
						<button
							className='gm-modal-close'
							onClick={() => setShowContactAssignmentModal(false)}>
							<FontAwesomeIcon icon={faXmark} />
						</button>
						<h2>
							<FontAwesomeIcon
								icon={faPaperPlane}
								className='me-2'
								style={{ opacity: 0.7 }}
							/>
							Assign Contacts to Group
						</h2>
						<p>
							Assign <strong style={{ color: '#fff' }}>{selectedContacts.length}</strong> selected
							contact{selectedContacts.length > 1 ? 's' : ''} to a group
						</p>
					</div>

					<div className='gm-modal-body'>
						{/* Selected contacts summary */}
						<div
							style={{
								background: 'rgba(54,153,255,0.05)',
								borderRadius: '12px',
								padding: '16px 20px',
								marginBottom: '20px',
								border: '1px solid rgba(54,153,255,0.1)',
							}}>
							<div
								style={{
									fontSize: '0.8rem',
									fontWeight: 700,
									color: '#3699FF',
									marginBottom: '8px',
									display: 'flex',
									alignItems: 'center',
									gap: '6px',
								}}>
								<FontAwesomeIcon icon={faCheckDouble} />
								Selected Contacts
							</div>
							<div
								style={{
									fontSize: '1.5rem',
									fontWeight: 700,
									color: '#1e1e2d',
								}}>
								{selectedContacts.length}
							</div>
							<div style={{ fontSize: '0.82rem', color: '#a1a5b7' }}>
								contact{selectedContacts.length > 1 ? 's' : ''} will be assigned
							</div>
						</div>

						<div className='gm-form-group'>
							<SelectField
								className='col-12 fv-row mb-7'
								name='assign_group_id'
								label='Select Target Group'
								htmlFor='assign_group_id'
								value={getGroupOptionFromId(selectedGroupIdForAssignment)}
								onChange={(e) => {
									const selectedGroupId = getGroupIdFromOption(e.target.value)
									setSelectedGroupIdForAssignment(selectedGroupId)
								}}
								options={groupOptions}
								disabled={loadingGroups}
							/>
						</div>

						{/* Hierarchy preview for assignment */}
						{selectedGroupIdForAssignment && (
							<div
								style={{
									background: '#f9fafb',
									borderRadius: '12px',
									padding: '16px 20px',
								}}>
								<div
									style={{
										fontSize: '0.78rem',
										fontWeight: 700,
										color: '#a1a5b7',
										textTransform: 'uppercase',
										letterSpacing: '0.5px',
										marginBottom: '10px',
									}}>
									Assignment Path
								</div>
								<div className='gm-hierarchy-path'>
									<div
										className='gm-hierarchy-dot'
										style={{ background: '#f59e0b', width: 10, height: 10 }}
									/>
									<span
										style={{
											fontSize: '0.85rem',
											fontWeight: 600,
											color: '#f59e0b',
										}}>
										{selectedContacts.length} Contact
										{selectedContacts.length > 1 ? 's' : ''}
									</span>
									<div className='gm-hierarchy-line' />
									<FontAwesomeIcon
										icon={faChevronRight}
										style={{ fontSize: '0.5rem', color: '#d1d5db' }}
									/>
									<div className='gm-hierarchy-line' />
									<div
										className='gm-hierarchy-dot'
										style={{ background: '#10b981', width: 10, height: 10 }}
									/>
									<span
										style={{
											fontSize: '0.85rem',
											fontWeight: 600,
											color: '#10b981',
										}}>
										{getGroupOptionFromId(selectedGroupIdForAssignment).split(' (')[0] || 'Group'}
									</span>
								</div>
							</div>
						)}
					</div>

					<div className='gm-modal-footer'>
						<button
							className='gm-btn gm-btn-outline'
							onClick={() => {
								setShowContactAssignmentModal(false)
								setSelectedGroupIdForAssignment('')
							}}>
							Cancel
						</button>
						<button
							className='gm-btn gm-btn-success'
							onClick={() => handleAssignContactsToGroup(selectedGroupIdForAssignment)}
							disabled={!selectedGroupIdForAssignment || selectedContacts.length === 0}>
							<FontAwesomeIcon icon={faPaperPlane} />
							Assign to Group
						</button>
					</div>
				</div>
			</Modal>
		</>
	)
}

export default GroupManagement
