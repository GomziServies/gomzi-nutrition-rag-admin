import React, { useState } from 'react'
import { Button, Form, Row, Col } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { CreateExpenseReport } from '../../../Functions/FGGroup/ExpenseReport'
import { FG_GROUP_FILE_BASE_URL } from '../../../constants/base_URL'

interface ExpenseItem {
    type: string
    description: string
    amount: string
    file_url?: string
}

interface SelectedFile {
    file: File
    previewUrl: string
}

const EmployeeExpenseCreate: React.FC = () => {
    const navigate = useNavigate()
    
    const [purpose, setPurpose] = useState('')
    const [remarks, setRemarks] = useState('')
    const [expenses, setExpenses] = useState<ExpenseItem[]>([{ type: '', description: '', amount: '' }])
    const [selectedFiles, setSelectedFiles] = useState<{[key: number]: SelectedFile[]}>({})
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    
    const [errors, setErrors] = useState({
        purpose: '',
        expenses: '',
        files: ''
    })

    const handleAddExpense = () => {
        setExpenses([...expenses, { type: '', description: '', amount: '' }])
    }

    const handleRemoveExpense = (index: number) => {
        if (expenses.length > 1) {
            const newExpenses = [...expenses]
            newExpenses.splice(index, 1)
            setExpenses(newExpenses)
            
            const newSelectedFiles = {...selectedFiles}
            delete newSelectedFiles[index]
            setSelectedFiles(newSelectedFiles)
        }
    }

    const handleExpenseChange = (index: number, field: keyof ExpenseItem, value: string) => {
        const newExpenses = [...expenses]
        newExpenses[index][field] = value
        setExpenses(newExpenses)
        
        if (errors.expenses) {
            setErrors(prev => ({ ...prev, expenses: '' }))
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, expenseIndex: number) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const newSelectedFiles: SelectedFile[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const previewUrl = URL.createObjectURL(file)
            newSelectedFiles.push({ file, previewUrl })
        }

        setSelectedFiles(prev => ({
            ...prev,
            [expenseIndex]: [...(prev[expenseIndex] || []), ...newSelectedFiles]
        }))
        e.target.value = ''
    }

    const handleRemoveFile = (expenseIndex: number, fileIndex: number) => {
        const newSelectedFiles = {...selectedFiles}
        const removedFile = newSelectedFiles[expenseIndex].splice(fileIndex, 1)[0]
        URL.revokeObjectURL(removedFile.previewUrl)
        
        if (newSelectedFiles[expenseIndex].length === 0) {
            delete newSelectedFiles[expenseIndex]
        }
        
        setSelectedFiles(newSelectedFiles)
    }

    const validateForm = () => {
        let isValid = true
        const newErrors = { purpose: '', expenses: '', files: '' }

        if (!purpose.trim()) {
            newErrors.purpose = 'Purpose is required'
            isValid = false
        }

        let hasValidExpense = false
        for (const expense of expenses) {
            if (expense.type.trim() && expense.amount && parseFloat(expense.amount) > 0) {
                hasValidExpense = true
                break
            }
        }

        if (!hasValidExpense) {
            newErrors.expenses = 'At least one valid expense is required'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const calculateTotalAmount = () => {
        return expenses.reduce((total, expense) => {
            const amount = parseFloat(expense.amount) || 0
            return total + amount
        }, 0)
    }

    const uploadFilesForExpense = async (expenseIndex: number): Promise<string[]> => {
        const files = selectedFiles[expenseIndex]
        if (!files || files.length === 0) return []

        const uploadedUrls: string[] = []
        
        try {
            for (const selectedFile of files) {
                const response: any = await FileUploadToFGGroup([selectedFile.file])
                if (response && response.status === 200 && response.data?.fileURLs) {
                    uploadedUrls.push(response.data.fileURLs[0])
                } else {
                    throw new Error(`Failed to upload file: ${selectedFile.file.name}`)
                }
            }
        } catch (error) {
            console.error('File upload error:', error)
            throw error
        }
        
        return uploadedUrls
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            toast.error('Please fix the errors before submitting')
            return
        }

        setLoading(true)
        setUploading(true)
        
        try {
            const fgGroupInfo =
                localStorage.getItem('fg_group_user_info') ||
                localStorage.getItem('fg_group_info') ||
                localStorage.getItem('auth_fg_group')
            let employeeId = null
            if (fgGroupInfo) {
                try {
                    const parsedInfo = JSON.parse(fgGroupInfo)
                    employeeId = parsedInfo._id || parsedInfo.employee_id
                } catch (e) {
                    console.error(e)
                }
            }

            if (!employeeId) {
                throw new Error('Employee ID not found')
            }

            const expenseItems = []
            for (let i = 0; i < expenses.length; i++) {
                const expense = expenses[i]
                if (expense.type.trim() && expense.amount && parseFloat(expense.amount) > 0) {
                    const fileUrls = await uploadFilesForExpense(i)
                    
                    const fullFileUrls = fileUrls.map(url => 
                        url.startsWith('http') ? url : `${FG_GROUP_FILE_BASE_URL}/${url}`
                    )
                    
                    expenseItems.push({
                        type: expense.type,
                        description: expense.description,
                        amount: parseFloat(expense.amount),
                        file_url: fullFileUrls.length > 0 ? fullFileUrls[0] : undefined
                    })
                }
            }

            const response = await CreateExpenseReport({
                employee_id: employeeId,
                purpose: purpose.trim(),
                expenses: expenseItems,
                remarks: remarks.trim()
            })

            if (response.status === 201) {
                toast.success('Expense report created successfully')
                navigate('/employee/expenses-list')
            } else {
                throw new Error(response.message || 'Failed to create expense report')
            }
        } catch (error: any) {
            console.error('Error creating expense report:', error)
            toast.error(error.message || 'Error creating expense report')
        } finally {
            setUploading(false)
            setLoading(false)
        }
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Create Expense Report</PageTitle>

            <div className='card shadow-sm border-0' style={{ borderRadius: '14px', background: '#ffffff' }}>
                {/* Header */}
                <div className='card-header border-0 pt-6 d-flex flex-wrap align-items-center justify-content-between gap-3'>
                    <div className='d-flex align-items-center gap-3'>
                        <button
                            type='button'
                            className='btn btn-sm btn-light d-flex align-items-center gap-2'
                            style={{ borderRadius: '8px' }}
                            onClick={() => navigate('/employee/expenses-list')}
                            disabled={uploading || loading}>
                            <i className='bi bi-arrow-left fs-6'></i>
                            <span>Back</span>
                        </button>
                        <div>
                            <h2 className='fw-bolder text-gray-900 mb-0'>New Expense Report</h2>
                            <span className='text-muted fs-7'>
                                Submit a new reimbursement claim with itemized expenses & receipts
                            </span>
                        </div>
                    </div>

                    <div className='d-flex align-items-center gap-3'>
                        <span className='fs-7 text-muted'>Total Amount:</span>
                        <span className='fs-4 fw-bolder text-primary'>
                            ₹{calculateTotalAmount().toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                    </div>
                </div>

                <div className='card-body pt-4'>
                    <Form onSubmit={handleSubmit}>
                        {/* Purpose & Remarks Row */}
                        <div className='row g-4 mb-6'>
                            <div className='col-12 col-md-6'>
                                <Form.Group>
                                    <Form.Label className='fw-bold text-gray-700 fs-7'>
                                        Purpose / Report Title <span className='text-danger'>*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type='text'
                                        placeholder='e.g., Client Visit Surat, Client Dinner'
                                        value={purpose}
                                        style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
                                        onChange={(e) => {
                                            setPurpose(e.target.value)
                                            if (errors.purpose) setErrors(prev => ({ ...prev, purpose: '' }))
                                        }}
                                        isInvalid={!!errors.purpose}
                                    />
                                    <Form.Control.Feedback type='invalid'>
                                        {errors.purpose}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </div>

                            <div className='col-12 col-md-6'>
                                <Form.Group>
                                    <Form.Label className='fw-bold text-gray-700 fs-7'>Remarks / Notes (Optional)</Form.Label>
                                    <Form.Control
                                        type='text'
                                        placeholder='Enter any additional context or notes'
                                        value={remarks}
                                        style={{ height: '42px', borderRadius: '8px', borderColor: '#ded8d2' }}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        {/* Expense Items Box */}
                        <div className='card border mb-6' style={{ borderRadius: '12px', background: '#fafbfc' }}>
                            <div className='card-header border-0 pt-4 pb-2 d-flex align-items-center justify-content-between'>
                                <div className='d-flex align-items-center gap-2'>
                                    <i className='bi bi-list-check text-primary fs-5'></i>
                                    <h4 className='fw-bolder text-gray-900 mb-0'>Line Items ({expenses.length})</h4>
                                </div>
                                <button 
                                    type='button'
                                    className='btn btn-sm btn-primary d-flex align-items-center gap-2 px-3' 
                                    onClick={handleAddExpense}
                                    style={{ borderRadius: '8px' }}
                                >
                                    <i className='bi bi-plus-lg fs-7'></i>
                                    <span>Add Expense Item</span>
                                </button>
                            </div>

                            <div className='card-body pt-2'>
                                {expenses.map((expense, index) => (
                                    <div 
                                        key={index} 
                                        className='p-4 mb-4 rounded-3 border bg-white shadow-xs'
                                        style={{ borderColor: '#e2e8f0' }}
                                    >
                                        <div className='d-flex align-items-center justify-content-between mb-3'>
                                            <span className='badge badge-light-primary fw-bold fs-7'>
                                                Item #{index + 1}
                                            </span>
                                            {expenses.length > 1 && (
                                                <button
                                                    type='button'
                                                    className='btn btn-icon btn-sm btn-light-danger'
                                                    style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                                                    onClick={() => handleRemoveExpense(index)}
                                                    title='Remove item'
                                                >
                                                    <i className='bi bi-trash fs-6'></i>
                                                </button>
                                            )}
                                        </div>

                                        <Row className='g-3'>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label className='fs-7 fw-semibold text-gray-700'>
                                                        Expense Type <span className='text-danger'>*</span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type='text'
                                                        placeholder='e.g., Travel, Meal, Fuel'
                                                        value={expense.type}
                                                        style={{ height: '38px', borderRadius: '8px', borderColor: '#ded8d2' }}
                                                        onChange={(e) => handleExpenseChange(index, 'type', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={5}>
                                                <Form.Group>
                                                    <Form.Label className='fs-7 fw-semibold text-gray-700'>Description</Form.Label>
                                                    <Form.Control
                                                        type='text'
                                                        placeholder='Brief explanation of expense'
                                                        value={expense.description}
                                                        style={{ height: '38px', borderRadius: '8px', borderColor: '#ded8d2' }}
                                                        onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>

                                            <Col md={3}>
                                                <Form.Group>
                                                    <Form.Label className='fs-7 fw-semibold text-gray-700'>
                                                        Amount (₹) <span className='text-danger'>*</span>
                                                    </Form.Label>
                                                    <Form.Control
                                                        type='number'
                                                        placeholder='0.00'
                                                        min='0'
                                                        step='0.01'
                                                        value={expense.amount}
                                                        style={{ height: '38px', borderRadius: '8px', borderColor: '#ded8d2' }}
                                                        onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        
                                        {/* File upload for this specific expense */}
                                        <div className='mt-3 pt-3 border-top border-gray-200'>
                                            <div className='d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2'>
                                                <label className='fs-7 fw-semibold text-muted mb-0'>
                                                    <i className='bi bi-paperclip me-1'></i>
                                                    Attach receipt/bill (image or PDF)
                                                </label>
                                            </div>
                                            <Form.Control
                                                type='file'
                                                multiple
                                                onChange={(e) => handleFileSelect(e as any, index)}
                                                disabled={uploading || loading}
                                                style={{ borderRadius: '8px' }}
                                            />
                                            
                                            {selectedFiles[index] && selectedFiles[index].length > 0 && (
                                                <div className='mt-2 d-flex flex-wrap gap-2'>
                                                    {selectedFiles[index].map((selectedFile, fileIndex) => (
                                                        <div 
                                                            key={fileIndex} 
                                                            className='d-flex align-items-center bg-light border rounded px-3 py-1 gap-2'
                                                        >
                                                            <i className='bi bi-file-earmark-check text-success'></i>
                                                            <span className='fs-8 fw-semibold text-gray-800' style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {selectedFile.file.name}
                                                            </span>
                                                            <button
                                                                type='button'
                                                                className='btn btn-icon btn-xs btn-light-danger p-0'
                                                                style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                                                                onClick={() => handleRemoveFile(index, fileIndex)}
                                                                disabled={uploading || loading}
                                                            >
                                                                <i className='bi bi-x fs-7'></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                
                                {errors.expenses && (
                                    <div className='alert alert-danger py-2 px-3 fs-7 mb-3'>{errors.expenses}</div>
                                )}
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className='d-flex align-items-center justify-content-between pt-4 border-top'>
                            <div className='d-flex align-items-center gap-2'>
                                <span className='text-muted fs-7'>Total Claim:</span>
                                <span className='fs-3 fw-bolder text-primary'>
                                    ₹{calculateTotalAmount().toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>

                            <div className='d-flex gap-3'>
                                <Button 
                                    variant='light' 
                                    onClick={() => navigate('/employee/expenses-list')}
                                    disabled={uploading || loading}
                                    style={{ borderRadius: '8px' }}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant='primary' 
                                    type='submit'
                                    disabled={uploading || loading}
                                    style={{ borderRadius: '8px', minWidth: '150px' }}
                                >
                                    {uploading || loading ? (
                                        <span className='d-flex align-items-center gap-2'>
                                            <span className='spinner-border spinner-border-sm' role='status' aria-hidden='true'></span>
                                            <span>Submitting...</span>
                                        </span>
                                    ) : (
                                        'Create Expense Report'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
        </>
    )
}

export default EmployeeExpenseCreate