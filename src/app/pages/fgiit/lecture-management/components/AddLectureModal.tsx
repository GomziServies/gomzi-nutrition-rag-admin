import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import toast from 'react-hot-toast';


interface AddLectureModalProps {
    show: boolean;
    onHide: () => void;
    courseId: string | undefined;
    selectedBatchType: 'Weekend' | 'Weekday' | null;
    batches: any[];
    mentors: any[];
    chapters: any[];
    onSubmit?: (data: any) => void;
}

const AddLectureModal: React.FC<AddLectureModalProps> = ({
    show,
    onHide,
    courseId,
    selectedBatchType,
    batches,
    mentors,
    chapters,
    onSubmit
}) => {
    const [loading, setLoading] = useState(false);

    // Derived state for filtered batches based on type
    const [filteredBatches, setFilteredBatches] = useState<any[]>([]);

    useEffect(() => {
        if (show && batches.length > 0) {
            let filtered = batches;
            if (selectedBatchType) {
                const typeKey = selectedBatchType === 'Weekend' ? 'weekend' : 'weekday';
                // Filter by batchType field (FGIITBatch), fallback to batchName string match
                filtered = batches.filter((b: any) =>
                    b.batchType ? b.batchType === typeKey
                        : selectedBatchType === 'Weekend'
                            ? b.batchName.toLowerCase().includes('weekend')
                            : b.batchName.toLowerCase().includes('week')
                );
            }
            setFilteredBatches(filtered);
        } else {
            setFilteredBatches([]);
        }
    }, [show, batches, selectedBatchType]);

    const [form, setForm] = useState({
        batchId: '',
        topic: '',
        classNumber: '',
        date: '',
        time: '',
        mentorId: '',
        zoomLink: '',
        description: '',
        lecturePdf: '',
        sendReminder: false,
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);




    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
            // Mock upload by just setting name
            setForm(prev => ({
                ...prev,
                lecturePdf: e.target.files![0].name
            }));
        }
    };

    const handleSubmit = async () => {
        if (!form.batchId || !form.topic || !form.date || !form.time) {
            toast.error("Please fill all required fields");
            return;
        }

        setLoading(true);

        // Simulate API delay
        setTimeout(() => {
            if (onSubmit) {
                onSubmit(form);
            }
            setLoading(false);

            setForm({
                batchId: '',
                topic: '',
                classNumber: '',
                date: '',
                time: '',
                mentorId: '',
                zoomLink: '',
                description: '',
                lecturePdf: '',
                sendReminder: false,
            });
            setSelectedFile(null);
        }, 800);
    };

    return (
        <Modal show={show} onHide={onHide} size='lg' centered>
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="fw-bolder fs-3">Schedule {selectedBatchType} Class</Modal.Title>
            </Modal.Header>
            <Modal.Body className='p-5 pt-0'>
                <Form className="mt-5">
                    <div className='row'>
                        <div className='col-md-6 mb-5'>
                            <Form.Group>
                                <Form.Label className='required fw-bold fs-6 mb-2'>Select Batch</Form.Label>
                                <Form.Select
                                    className="form-select-solid"
                                    value={form.batchId}
                                    onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                                >
                                    <option value="">Select Batch</option>
                                    {filteredBatches.map((b: any) => (
                                        <option key={b._id || b.id} value={b._id || b.id}>{b.batchName}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className='col-md-6 mb-5'>
                            <Form.Group>
                                <Form.Label className='required fw-bold fs-6 mb-2'>Chapter Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    className="form-control-solid"
                                    value={form.topic}
                                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                                    placeholder="Enter chapter / lecture name"
                                />
                            </Form.Group>
                        </div>
                        <div className='col-md-6 mb-5'>
                            <Form.Group>
                                <Form.Label className='required fw-bold fs-6 mb-2'>Faculty Name</Form.Label>
                                <Form.Select
                                    className="form-select-solid"
                                    value={form.mentorId}
                                    onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
                                >
                                    <option value="">Select Faculty</option>
                                    {mentors.map((m: any) => (
                                        <option key={m._id || m.id} value={m._id || m.id}>{m.mentorName || m.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <div className='col-md-6 mb-5'>
                            <Form.Group>
                                <Form.Label className='required fw-bold fs-6 mb-2'>Class Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    className="form-control-solid"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                />
                            </Form.Group>
                        </div>
                        <div className='col-md-6 mb-5'>
                            <Form.Group>
                                <Form.Label className='required fw-bold fs-6 mb-2'>Class Time</Form.Label>
                                <Form.Control
                                    type="time"
                                    className="form-control-solid"
                                    value={form.time}
                                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                                />
                            </Form.Group>
                        </div>
                        <div className='col-md-6 mb-5'>
                            <Form.Group>
                                <Form.Label className="fw-bold fs-6 mb-2">Zoom Meeting Link</Form.Label>
                                <Form.Control
                                    type="url"
                                    className="form-control-solid"
                                    value={form.zoomLink}
                                    onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
                                    placeholder="https://zoom.us/..."
                                />
                            </Form.Group>
                        </div>
                        <div className='col-md-6 mb-5'>
                            <Form.Group>
                                <Form.Label className="fw-bold fs-6 mb-2">
                                    Upload PDF/PPT {form.lecturePdf && <span className="text-success fs-7 ms-2">(Auto-filled)</span>}
                                </Form.Label>
                                <Form.Control
                                    type="file"
                                    className="form-control-solid"
                                    accept=".pdf,.ppt,.pptx"
                                    onChange={handleFileChange}
                                />
                                {form.lecturePdf && (
                                    <div className="mt-2 text-muted fs-8">
                                        Selected: {form.lecturePdf}
                                    </div>
                                )}
                            </Form.Group>
                        </div>
                        <div className='col-md-12 mb-5'>
                            <Form.Group>
                                <Form.Label className="fw-bold fs-6 mb-2">Short Notes</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    className="form-control-solid"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Optional notes for students..."
                                />
                            </Form.Group>
                        </div>
                        <div className='col-md-12 mb-5'>
                            <div className="d-flex align-items-center">
                                <label className="form-check form-switch form-check-custom form-check-solid">
                                    <input
                                        className="form-check-input w-40px h-20px"
                                        type="checkbox"
                                        checked={form.sendReminder}
                                        onChange={(e) => setForm({ ...form, sendReminder: e.target.checked })}
                                    />
                                    <span className="form-check-label fw-bold text-gray-700 fs-6 ms-3">
                                        Send Email & WhatsApp Reminder
                                    </span>
                                </label>
                            </div>
                        </div>


                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="light" onClick={onHide} className="me-2">Cancel</Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading} className="fw-bold px-6">
                    {loading ? 'Scheduling...' : 'Schedule Class'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddLectureModal;
