import React, { useEffect, useState } from 'react'
import { Button, Form, Card, Row, Col } from 'react-bootstrap'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { KTCard } from '../../../../_metronic/helpers'
import { PageTitle } from '../../../../_metronic/layout/core'
import { FileUploadToFGGroup } from '../../../Functions/FGGroup'
import { GetExpenseReports, UpdateExpenseReport } from '../../../Functions/FGGroup/ExpenseReport'

interface ExpenseItem {
    type: string
    description: string
    amount: string
    file_url?: string // Add file_url to expense item
}

const EmployeeExpenseEdit: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const reportId = queryParams.get('id')
    
    const [purpose, setPurpose] = useState('')
    const [remarks, setRemarks] = useState('')
    const [expenses, setExpenses] = useState<ExpenseItem[]>([{ type: '', description: '', amount: '' }])
    const [expenseFileUrls, setExpenseFileUrls] = useState<{[key: number]: string[]}>({}) // Store file URLs per expense
    const [uploading, setUploading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(true)
    
    // Form validation errors
    const [errors, setErrors] = useState({
        purpose: '',
        expenses: '',
        files: ''
    })

    // Fetch existing expense report data
    useEffect(() => {
        const fetchExpenseReport = async () => {
            if (!reportId) {
                toast.error('Report ID not provided')
                navigate('/employee/expenses-list')
                return
            }

            try {
                // Get employee ID from localStorage
                const fgGroupInfo = localStorage.getItem('fg_group_info')
                let employeeId = null
                if (fgGroupInfo) {
                    const parsedInfo = JSON.parse(fgGroupInfo)
                    employeeId = parsedInfo._id
                }

                if (!employeeId) {
                    throw new Error('Employee ID not found')
                }

                const response = await GetExpenseReports({
                    id: reportId,
                    employee_id: employeeId
                })

                if (response.data && response.data.length > 0) {
                    const report = response.data[0]
                    
                    // Check if report can be edited (only pending reports)
                    if (report.status !== 'Pending') {
                        toast.error('Only pending reports can be edited')
                        navigate(`/employee/expense-view?id=${reportId}`)
                        return
                    }

                    setPurpose(report.purpose || '')
                    setRemarks(report.remarks || '')
                    
                    // Convert expense amounts to string for the form and initialize file URLs
                    const formattedExpenses = report.expenses?.map((exp: any, index: number) => {
                        // Initialize file URLs for each expense
                        if (exp.file_url) {
                            setExpenseFileUrls(prev => ({
                                ...prev,
                                [index]: [exp.file_url]
                            }))
                        }
                        
                        return {
                            type: exp.type || '',
                            description: exp.description || '',
                            amount: exp.amount ? exp.amount.toString() : '',
                            file_url: exp.file_url || ''
                        }
                    }) || [{ type: '', description: '', amount: '' }]
                    
                    setExpenses(formattedExpenses)
                } else {
                    toast.error('Expense report not found')
                    navigate('/employee/expenses-list')
                }
            } catch (error) {
                console.error('Error fetching expense report:', error)
                toast.error('Error fetching expense report')
                navigate('/employee/expenses-list')
            } finally {
                setLoadingData(false)
            }
        }

        fetchExpenseReport()
    }, [reportId, navigate])

    // Handle adding a new expense item
    const handleAddExpense = () => {
        setExpenses([...expenses, { type: '', description: '', amount: '' }])
    }

    // Handle removing an expense item
    const handleRemoveExpense = (index: number) => {
        if (expenses.length > 1) {
            const newExpenses = [...expenses]
            newExpenses.splice(index, 1)
            setExpenses(newExpenses)
            
            // Remove associated file URLs
            const newExpenseFileUrls = {...expenseFileUrls}
            delete newExpenseFileUrls[index]
            setExpenseFileUrls(newExpenseFileUrls)
        }
    }

    // Handle expense item change
    const handleExpenseChange = (index: number, field: keyof ExpenseItem, value: string) => {
        const newExpenses = [...expenses]
        newExpenses[index][field] = value
        setExpenses(newExpenses)
        
        // Clear error when user starts typing
        if (errors.expenses) {
            setErrors(prev => ({ ...prev, expenses: '' }))
        }
    }

    // Handle file upload for a specific expense
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, expenseIndex: number) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const uploadedUrls: string[] = []

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                // Pass the file as an array to FileUploadToFGGroup
                const response: any = await FileUploadToFGGroup([file])
                if (response && response.status === 200 && response.data?.fileURLs) {
                    // The file upload returns an array of file URLs, we take the first one
                    uploadedUrls.push(response.data.fileURLs[0])
                } else {
                    throw new Error(`Failed to upload file: ${file.name} - ${response?.message || 'Unknown error'}`)
                }
            }

            // Update file URLs for this expense
            setExpenseFileUrls(prev => ({
                ...prev,
                [expenseIndex]: [...(prev[expenseIndex] || []), ...uploadedUrls]
            }))
            
            toast.success(`${files.length} file(s) uploaded successfully`)
        } catch (error) {
            console.error('File upload error:', error)
            toast.error('Error uploading files')
        } finally {
            setUploading(false)
            e.target.value = '' // Reset file input
        }
    }

    // Handle file removal for a specific expense
    const handleRemoveFile = (expenseIndex: number, fileIndex: number) => {
        const newExpenseFileUrls = {...expenseFileUrls}
        newExpenseFileUrls[expenseIndex].splice(fileIndex, 1)
        
        if (newExpenseFileUrls[expenseIndex].length === 0) {
            delete newExpenseFileUrls[expenseIndex]
        }
        
        setExpenseFileUrls(newExpenseFileUrls)
    }

    // Validate form
    const validateForm = () => {
        let isValid = true
        const newErrors = { purpose: '', expenses: '', files: '' }

        // Validate purpose
        if (!purpose.trim()) {
            newErrors.purpose = 'Purpose is required'
            isValid = false
        }

        // Validate expenses
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

    // Calculate total amount
    const calculateTotalAmount = () => {
        return expenses.reduce((total, expense) => {
            const amount = parseFloat(expense.amount) || 0
            return total + amount
        }, 0)
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            toast.error('Please fix the errors before submitting')
            return
        }

        if (!reportId) {
            toast.error('Report ID not found')
            return
        }

        setLoading(true)
        
        try {
            // Prepare expense items for submission
            const expenseItems = expenses
                .filter(expense => expense.type.trim() && expense.amount && parseFloat(expense.amount) > 0)
                .map((expense, index) => {
                    // Get the first file URL for this expense if it exists
                    const fileUrls = expenseFileUrls[index] || []
                    const fileUrl = fileUrls.length > 0 ? fileUrls[0] : undefined
                    
                    return {
                        type: expense.type,
                        description: expense.description,
                        amount: parseFloat(expense.amount),
                        ...(fileUrl && { file_url: fileUrl }) // Only include file_url if it exists
                    }
                })

            const response = await UpdateExpenseReport({
                id: reportId,
                purpose: purpose.trim(),
                expenses: expenseItems,
                remarks: remarks.trim()
            })

            if (response.status === 200) {
                toast.success('Expense report updated successfully')
                navigate(`/employee/expense-view?id=${reportId}`)
            } else {
                throw new Error(response.message || 'Failed to update expense report')
            }
        } catch (error) {
            console.error('Error updating expense report:', error)
            toast.error('Error updating expense report')
        } finally {
            setLoading(false)
        }
    }

    if (loadingData) {
        return <div>Loading...</div>
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Edit Expense Report</PageTitle>
            <KTCard>
                <div className='card-header border-0 pt-6'>
                    <div className='card-title'>
                        <h2>Edit Expense Report</h2>
                    </div>
                </div>
                <div className='card-body'>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={12}>
                                <Form.Group className='mb-6'>
                                    <Form.Label>Purpose<span className='text-danger'>*</span></Form.Label>
                                    <Form.Control
                                        type='text'
                                        placeholder='Enter purpose of expense report'
                                        value={purpose}
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
                            </Col>
                        </Row>

                        <Card className='mb-6'>
                            <Card.Header>
                                <div className='card-title'>
                                    <h3>Expenses</h3>
                                </div>
                                <div className='card-toolbar'>
                                    <Button 
                                        variant='primary' 
                                        onClick={handleAddExpense}
                                        size='sm'
                                    >
                                        <i className='fas fa-plus me-1'></i>Add Expense
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {expenses.map((expense, index) => (
                                    <Card key={index} className='mb-4'>
                                        <Card.Body>
                                            <Row>
                                                <Col md={4}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Type<span className='text-danger'>*</span></Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            placeholder='e.g., Travel, Meal, etc.'
                                                            value={expense.type}
                                                            onChange={(e) => handleExpenseChange(index, 'type', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Description</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            placeholder='Enter description'
                                                            value={expense.description}
                                                            onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Amount (₹)<span className='text-danger'>*</span></Form.Label>
                                                        <Form.Control
                                                            type='number'
                                                            placeholder='0.00'
                                                            min='0'
                                                            step='0.01'
                                                            value={expense.amount}
                                                            onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={1} className='d-flex align-items-end'>
                                                    {expenses.length > 1 && (
                                                        <Button
                                                            variant='danger'
                                                            size='sm'
                                                            onClick={() => handleRemoveExpense(index)}
                                                        >
                                                            <i className='fas fa-trash'></i>
                                                        </Button>
                                                    )}
                                                </Col>
                                            </Row>
                                            
                                            {/* File upload for this specific expense */}
                                            <Row>
                                                <Col md={12}>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Upload Receipts/Documents for this expense</Form.Label>
                                                        <Form.Control
                                                            type='file'
                                                            multiple
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileUpload(e, index)}
                                                            disabled={uploading}
                                                        />
                                                    </Form.Group>
                                                    
                                                    {expenseFileUrls[index] && expenseFileUrls[index].length > 0 && (
                                                        <div className='mt-2'>
                                                            <h6>Uploaded Files:</h6>
                                                            <div className='d-flex flex-wrap gap-2'>
                                                                {expenseFileUrls[index].map((url: string, fileIndex: number) => (
                                                                    <div key={fileIndex} className='d-flex align-items-center border rounded p-2'>
                                                                        <span className='me-2'>{url.split('/').pop()}</span>
                                                                        <Button
                                                                            variant='danger'
                                                                            size='sm'
                                                                            onClick={() => handleRemoveFile(index, fileIndex)}
                                                                            disabled={uploading}
                                                                        >
                                                                            <i className='fas fa-times'></i>
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                ))}
                                
                                {errors.expenses && (
                                    <div className='text-danger mb-3'>{errors.expenses}</div>
                                )}
                                
                                <div className='d-flex justify-content-end'>
                                    <h4>Total Amount: ₹{calculateTotalAmount().toFixed(2)}</h4>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className='d-flex justify-content-end gap-3'>
                            <Button 
                                variant='secondary' 
                                onClick={() => navigate(`/employee/expense-view?id=${reportId}`)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant='primary' 
                                type='submit'
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Update Expense Report'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </KTCard>
        </>
    )
}

export default EmployeeExpenseEdit