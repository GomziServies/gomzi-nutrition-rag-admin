
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import { PageTitle } from "../../../../_metronic/layout/core";
import { KTCard } from "../../../../_metronic/helpers";
import LengthMenu from "../../../components/LengthMenu";
import SearchFilter from "../../../components/SearchFilter";
import Table from "../../../components/Table";
import TableButton from "../../../components/TableButton";
import UsersListPagination from "../../../components/TablePagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import {
  CreateFGIITMentor,
  GetFGIITMentors,
  UpdateFGIITMentor,
  RemoveFGIITMentor,
} from "../../../Functions/FGGroup/FGIITMentor";
import {
  FGIITSyllabus,
  createFGIITSyllabus,
  getFGIITSyllabus,
} from "../../../Functions/FGGroup/FGIITSyllabus";
import {
  FGIITBatch,
  createFGIITBatch,
  getFGIITBatch,
  updateFGIITBatch,
  removeFGIITBatch,
} from "../../../Functions/FGGroup/FGIITBatch";
import {
  GetLectureReminder,
  AddLectureReminder,
  UpdateLectureReminder,
  DeleteLectureReminder,
} from "../../../Functions/FGGroup/LectureReminder";
import {
  FGIITSyllabusChapter,
  getFGIITSyllabusChapters,
} from "../../../Functions/FGGroup/FGIITSyllabusChapter";
import { FileUploadToFGGroup } from "../../../Functions/FGGroup/AccountFunctions";
import Swal from "sweetalert2";

interface Mentor {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  department: string;
  specialization: string;
  coursesAssigned: number;
  otherDocuments?: { name: string; url: string; file?: File }[];
}

interface Lecture {
  id: string;
  lectureName: string;
  courseName: string;
  batchName: string;
  classNumber: number;
  chapterName: string;
  mentorName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: string;
  status: "upcoming" | "in-progress" | "pending";
  room?: string;
  zoomLink?: string;
  shortNotes?: string;
  pptPdfFile?: string;
  pptPdfFileName?: string;
  pptPdfUrl?: string;
  reminderEnabled?: boolean;
}

const LectureOverview: React.FC = () => {
  const navigate = useNavigate();
  const [visibleDetails, setVisibleDetails] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddMentorModal, setShowAddMentorModal] = useState(false);
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [showViewMentorModal, setShowViewMentorModal] = useState(false);
  const [showEditLectureModal, setShowEditLectureModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [editingMentorId, setEditingMentorId] = useState<string | null>(null);

  const [courses, setCourses] = useState<FGIITSyllabus[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<FGIITBatch[]>([]);
  const [availableSyllabus, setAvailableSyllabus] = useState<FGIITSyllabusChapter[]>([]);

  const [mentorSearchTerm, setMentorSearchTerm] = useState("");
  const [mentorSort, setMentorSort] = useState("name");
  const [mentorSortOrder, setMentorSortOrder] = useState<"asc" | "desc">("asc");
  const [mentorPagination, setMentorPagination] = useState({ page: 1, itemsPerPage: 10 });
  const [mentors, setMentors] = useState<Mentor[]>([]);

  const [lectureSearchTerm, setLectureSearchTerm] = useState("");
  const [lectureSort, setLectureSort] = useState("scheduledDate");
  const [lectureSortOrder, setLectureSortOrder] = useState<"asc" | "desc">("asc");
  const [lecturePagination, setLecturePagination] = useState({ page: 1, itemsPerPage: 10 });
  const [remainingLectures, setRemainingLectures] = useState<Lecture[]>([]);

  const [activeBatchType, setActiveBatchType] = useState<"weekend" | "weekday">("weekend");
  const [showCourseSelectModal, setShowCourseSelectModal] = useState(false);
  const [selectedBatchForModal, setSelectedBatchForModal] = useState<string | null>(null);

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchIsRunning, setNewBatchIsRunning] = useState(false);
  const [newBatchType, setNewBatchType] = useState<"weekend" | "weekday">("weekend");

  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<FGIITBatch | null>(null);
  const [editBatchName, setEditBatchName] = useState("");
  const [editBatchIsRunning, setEditBatchIsRunning] = useState(false);

  const [newCourse, setNewCourse] = useState({ courseName: "" });
  const [newMentor, setNewMentor] = useState({
    name: "", email: "", phone: "", department: "", specialization: "",
    profileImage: null as File | string | null,
    otherDocuments: [] as { name: string; url: string; file?: File }[],
  });
  const [newLecture, setNewLecture] = useState({
    courseName: "", batchName: "", classNumber: "", chapterName: "",
    mentorName: "", scheduledDate: "", scheduledTime: "",
    zoomLink: "", shortNotes: "", pptPdfFileName: "", pptPdfUrl: "",
  });

  // ── API Calls ──
  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await GetFGIITMentors();
      let data = Array.isArray(response) ? response : response?.data || [];
      setMentors(data.map((m: any) => ({
        id: m._id, name: m.mentorName, email: m.email, phone: m.mobileNo,
        department: m.department || "", specialization: m.specialization || "",
        profileImage: m.image, coursesAssigned: 0,
        otherDocuments: m.document ? [{ name: "Document", url: m.document }] : [],
      })));
    } catch { toast.error("Failed to load mentors"); }
    finally { setLoading(false); }
  };

  const fetchSyllabus = async () => {
    setLoadingCourses(true);
    try {
      const r = await getFGIITSyllabus({});
      setCourses(Array.isArray(r?.data) ? r.data : []);
    } catch { toast.error("Failed to fetch syllabus"); }
    finally { setLoadingCourses(false); }
  };

  const fetchBatches = async () => {
    try {
      const r = await getFGIITBatch({});
      setAvailableBatches(Array.isArray(r?.data) ? r.data : []);
    } catch { toast.error("Failed to fetch batches"); }
  };

  const fetchLectureReminders = async () => {
    try {
      const r = await GetLectureReminder({});
      if (r?.data) {
        setRemainingLectures((r.data as any[]).map((l: any) => ({
          id: l._id, lectureName: l.lecture_topic, courseName: "", batchName: "",
          classNumber: 0, chapterName: l.lecture_topic,
          mentorName: l.mentor_id?.mentorName || "Unknown",
          scheduledDate: l.lecture_date, scheduledTime: l.lecture_start_time,
          duration: "1h", status: "upcoming", zoomLink: "", shortNotes: "",
          pptPdfFileName: l.lecture_pdf?.split("/").pop() || "",
          pptPdfUrl: l.lecture_pdf,
          reminderEnabled: l.is_reminder_6am || l.is_reminder_1hour_before,
        })));
      }
    } catch { toast.error("Failed to fetch lectures"); }
  };

  useEffect(() => { fetchSyllabus(); fetchBatches(); fetchLectureReminders(); fetchMentors(); }, []);

  useEffect(() => {
    const load = async () => {
      if (!newLecture.courseName) { setAvailableSyllabus([]); return; }
      const sel = courses.find(c => c.syllabusName === newLecture.courseName);
      if (sel) {
        try {
          const r = await getFGIITSyllabusChapters({ syllabusId: sel._id });
          setAvailableSyllabus(Array.isArray(r?.data) ? r.data : []);
        } catch { setAvailableSyllabus([]); }
      }
    };
    load();
    setNewLecture(p => ({ ...p, classNumber: "", chapterName: "", pptPdfFileName: "", pptPdfUrl: "" }));
  }, [newLecture.courseName, courses]);

  useEffect(() => {
    if (newLecture.classNumber) {
      const sel = availableSyllabus.find(s => s.classNumber === parseInt(newLecture.classNumber));
      if (sel) setNewLecture(p => ({ ...p, chapterName: sel.chapterName, pptPdfFileName: sel.pdfFileName || "", pptPdfUrl: sel.pdfUrl || "" }));
    }
  }, [newLecture.classNumber, availableSyllabus]);

  // ── Handlers ──
  const handleAddBatch = async () => {
    if (!newBatchName.trim()) return toast.error("Batch name required");
    try {
      await createFGIITBatch({ batchName: newBatchName, batchType: newBatchType, isRunning: newBatchIsRunning, status: true });
      toast.success("Batch created"); setNewBatchName(""); setNewBatchType("weekend"); setNewBatchIsRunning(false); setShowAddBatchModal(false); fetchBatches();
    } catch { toast.error("Failed to create batch"); }
  };

  const handleOpenEditBatch = (b: FGIITBatch) => { setEditingBatch(b); setEditBatchName(b.batchName); setEditBatchIsRunning(b.isRunning); setShowEditBatchModal(true); };

  const handleUpdateBatch = async () => {
    if (!editingBatch || !editBatchName.trim()) return toast.error("Batch name required");
    try {
      await updateFGIITBatch({ batchId: editingBatch._id, batchName: editBatchName, isRunning: editBatchIsRunning });
      toast.success("Batch updated"); setShowEditBatchModal(false); setEditingBatch(null); fetchBatches();
    } catch { toast.error("Failed to update batch"); }
  };

  const handleDeleteBatch = async (b: FGIITBatch) => {
    const r = await Swal.fire({ title: "Delete Batch?", text: `Delete "${b.batchName}"?`, icon: "warning", showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Delete" });
    if (r.isConfirmed) { try { await removeFGIITBatch(b._id); toast.success("Batch deleted"); fetchBatches(); } catch { toast.error("Failed"); } }
  };

  const handleAddCourse = async () => {
    if (!newCourse.courseName) return toast.error("Name required");
    try { await createFGIITSyllabus({ syllabusName: newCourse.courseName }); toast.success("Syllabus added"); setShowAddCourseModal(false); setNewCourse({ courseName: "" }); fetchSyllabus(); }
    catch { toast.error("Failed"); }
  };

  const resetMentorForm = () => { setNewMentor({ name: "", email: "", phone: "", department: "", specialization: "", profileImage: null, otherDocuments: [] }); setEditingMentorId(null); };
  const resetLectureForm = () => { setNewLecture({ courseName: "", batchName: "", classNumber: "", chapterName: "", mentorName: "", scheduledDate: "", scheduledTime: "", zoomLink: "", shortNotes: "", pptPdfFileName: "", pptPdfUrl: "" }); };

  const handleAddMentor = async () => {
    if (!newMentor.name || !newMentor.email || !newMentor.phone) return toast.error("Fill required fields");
    setLoading(true);

    let imageUrl = "";
    if (newMentor.profileImage) {
      if (typeof newMentor.profileImage === "string") {
        imageUrl = newMentor.profileImage;
      } else {
        try {
          const res: any = await FileUploadToFGGroup([newMentor.profileImage]);
          if (res?.data?.fileURLs?.[0]) {
            imageUrl = res.data.fileURLs[0];
          }
        } catch (e) {
          toast.error("Failed to upload profile image");
          setLoading(false);
          return;
        }
      }
    }

    let documentUrl = "";
    if (newMentor.otherDocuments[0]?.file) {
      try {
        const res: any = await FileUploadToFGGroup([newMentor.otherDocuments[0].file]);
        if (res?.data?.fileURLs?.[0]) {
          documentUrl = res.data.fileURLs[0];
        }
      } catch (e) {
        toast.error("Failed to upload document");
        setLoading(false);
        return;
      }
    } else if (newMentor.otherDocuments[0]?.url) {
      documentUrl = newMentor.otherDocuments[0].url;
    }

    const payload: any = {
      mentorName: newMentor.name,
      email: newMentor.email,
      mobileNo: newMentor.phone,
      department: newMentor.department,
      specialization: newMentor.specialization,
    };
    if (imageUrl) payload.image = imageUrl;
    if (documentUrl) payload.document = documentUrl;
    if (editingMentorId) payload.id = editingMentorId;

    try {
      editingMentorId ? await UpdateFGIITMentor(payload) : await CreateFGIITMentor(payload);
      toast.success(editingMentorId ? "Updated" : "Added"); setShowAddMentorModal(false); resetMentorForm(); fetchMentors();
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  const handleEditMentor = (m: Mentor) => {
    setEditingMentorId(m.id);
    setNewMentor({ name: m.name, email: m.email, phone: m.phone, department: m.department, specialization: m.specialization, profileImage: null, otherDocuments: m.otherDocuments || [] });
    setShowAddMentorModal(true);
  };

  const handleDeleteMentor = async (id: string) => {
    const r = await Swal.fire({ title: "Delete Mentor?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Delete" });
    if (r.isConfirmed) { try { await RemoveFGIITMentor(id); toast.success("Deleted"); fetchMentors(); } catch { toast.error("Failed"); } }
  };

  const handleAddLecture = async () => {
    if (!newLecture.courseName || !newLecture.batchName || !newLecture.classNumber || !newLecture.mentorName || !newLecture.scheduledDate || !newLecture.scheduledTime) return toast.error("Fill required fields");
    try {
      const sc = courses.find(c => c.syllabusName === newLecture.courseName);
      const sb = availableBatches.find(b => b.batchName === newLecture.batchName);
      const sm = mentors.find(m => m.name === newLecture.mentorName);
      if (!sm?.id) return toast.error("Invalid mentor selected");
      await AddLectureReminder({ lecture_topic: newLecture.chapterName, lecture_date: newLecture.scheduledDate, lecture_start_time: newLecture.scheduledTime, mentor_id: sm.id, course_id: sc?._id, batch_id: sb?._id, lecture_pdf: newLecture.pptPdfUrl });
      toast.success("Lecture added"); setShowAddLectureModal(false); resetLectureForm(); fetchLectureReminders();
    } catch { toast.error("Failed"); }
  };

  const handleEditLecture = async () => {
    if (!selectedLecture) return;
    if (!newLecture.courseName || !newLecture.batchName || !newLecture.classNumber || !newLecture.mentorName || !newLecture.scheduledDate || !newLecture.scheduledTime) return toast.error("Fill required fields");
    try {
      const sc = courses.find(c => c.syllabusName === newLecture.courseName);
      const sb = availableBatches.find(b => b.batchName === newLecture.batchName);
      const sm = mentors.find(m => m.name === newLecture.mentorName);
      await UpdateLectureReminder({ reminder_id: selectedLecture.id, lecture_topic: newLecture.chapterName, lecture_date: newLecture.scheduledDate, lecture_start_time: newLecture.scheduledTime, mentor_id: sm?.id, course_id: sc?._id, batch_id: sb?._id, lecture_pdf: newLecture.pptPdfUrl });
      toast.success("Updated"); setShowEditLectureModal(false); setSelectedLecture(null); resetLectureForm(); fetchLectureReminders();
    } catch { toast.error("Failed"); }
  };

  const handleDeleteLecture = async (id: string) => {
    const r = await Swal.fire({ title: "Delete Lecture?", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Delete" });
    if (r.isConfirmed) { try { await DeleteLectureReminder({ reminder_id: id }); toast.success("Deleted"); fetchLectureReminders(); } catch { toast.error("Failed"); } }
  };

  const handleOpenEditLecture = (l: Lecture) => {
    setSelectedLecture(l);
    setNewLecture({ courseName: l.courseName, batchName: l.batchName, classNumber: String(l.classNumber), chapterName: l.chapterName, mentorName: l.mentorName, scheduledDate: l.scheduledDate, scheduledTime: l.scheduledTime, zoomLink: l.zoomLink || "", shortNotes: l.shortNotes || "", pptPdfFileName: l.pptPdfFileName || "", pptPdfUrl: l.pptPdfUrl || "" });
    setShowEditLectureModal(true);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type)) return toast.error("JPG/PNG only");
    if (f.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setNewMentor({ ...newMentor, profileImage: f });
  };

  const handleOtherDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setNewMentor(p => ({ ...p, otherDocuments: [...p.otherDocuments, ...Array.from(e.target.files!).map(f => ({ name: f.name, url: "", file: f }))] }));
  };

  const handleRemoveDocument = (i: number) => setNewMentor(p => ({ ...p, otherDocuments: p.otherDocuments.filter((_, idx) => idx !== i) }));

  const areAllRemindersEnabled = remainingLectures.length > 0 && remainingLectures.every(l => l.reminderEnabled);
  const handleToggleAllReminders = () => {
    const n = !areAllRemindersEnabled;
    setRemainingLectures(remainingLectures.map(l => ({ ...l, reminderEnabled: n })));
    toast.success(`Reminders ${n ? "enabled" : "disabled"}`);
  };

  // ── Filtered Data ──
  const filteredMentors = mentors.filter(m => !mentorSearchTerm || m.name.toLowerCase().includes(mentorSearchTerm.toLowerCase()) || m.email.toLowerCase().includes(mentorSearchTerm.toLowerCase()) || m.phone.includes(mentorSearchTerm));
  const mentorTotalPages = Math.ceil(filteredMentors.length / mentorPagination.itemsPerPage);
  const mentorStartIndex = (mentorPagination.page - 1) * mentorPagination.itemsPerPage;
  const paginatedMentors = filteredMentors.slice(mentorStartIndex, mentorStartIndex + mentorPagination.itemsPerPage);

  const mentorSortableFields = [
    { title: "Name", field: "name" },
    { title: "Email", field: "email" },
    { title: "Mobile No", field: "mobileno" },
  ];



  const getCourseIcon = (name: string) => {
    if (name.toLowerCase().includes("personal") || name.includes("DPT")) return "bi-person-arms-up";
    if (name.toLowerCase().includes("nutrition") || name.includes("DNC")) return "bi-apple";
    if (name.toLowerCase().includes("anabolic") || name.toLowerCase().includes("steroid")) return "bi-capsule";
    if (name.toLowerCase().includes("group")) return "bi-people-fill";
    if (name.toLowerCase().includes("injury") || name.toLowerCase().includes("rehab")) return "bi-heart-pulse";
    if (name.toLowerCase().includes("power")) return "bi-award-fill";
    return "bi-book";
  };

  // ── Shared Lecture Form ──
  const renderLectureForm = () => (
    <div className="row g-4">
      <div className="col-md-6">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Course <span className="text-danger">*</span></label>
        <select className="form-select form-select-solid" value={newLecture.courseName} onChange={e => setNewLecture({ ...newLecture, courseName: e.target.value })}>
          <option value="">Select course</option>
          {courses.map(c => <option key={c._id} value={c.syllabusName}>{c.syllabusName}</option>)}
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Batch <span className="text-danger">*</span></label>
        <select className="form-select form-select-solid" value={newLecture.batchName} onChange={e => setNewLecture({ ...newLecture, batchName: e.target.value })} disabled={!newLecture.courseName}>
          <option value="">{newLecture.courseName ? "Select batch" : "Select course first"}</option>
          {availableBatches.map(b => <option key={b._id} value={b.batchName}>{b.batchName}</option>)}
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Class No <span className="text-danger">*</span></label>
        <select className="form-select form-select-solid" value={newLecture.classNumber} onChange={e => setNewLecture({ ...newLecture, classNumber: e.target.value })} disabled={!newLecture.courseName}>
          <option value="">{newLecture.courseName ? "Select class" : "Select course first"}</option>
          {availableSyllabus.map(s => <option key={s._id} value={s.classNumber}>Class {s.classNumber} — {s.chapterName}</option>)}
        </select>
      </div>
      <div className="col-md-6">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Chapter</label>
        <input className="form-control form-control-solid bg-gray-100" value={newLecture.chapterName} readOnly disabled placeholder="Auto-filled" />
      </div>
      <div className="col-md-4">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Faculty <span className="text-danger">*</span></label>
        <select className="form-select form-select-solid" value={newLecture.mentorName} onChange={e => setNewLecture({ ...newLecture, mentorName: e.target.value })}>
          <option value="">Select faculty</option>
          {mentors.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
      </div>
      <div className="col-md-4">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Date <span className="text-danger">*</span></label>
        <input type="date" className="form-control form-control-solid" value={newLecture.scheduledDate} onChange={e => setNewLecture({ ...newLecture, scheduledDate: e.target.value })} />
      </div>
      <div className="col-md-4">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Time <span className="text-danger">*</span></label>
        <input type="time" className="form-control form-control-solid" value={newLecture.scheduledTime} onChange={e => setNewLecture({ ...newLecture, scheduledTime: e.target.value })} />
      </div>
      <div className="col-12">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Zoom Link</label>
        <input type="url" className="form-control form-control-solid" placeholder="https://zoom.us/j/..." value={newLecture.zoomLink} onChange={e => setNewLecture({ ...newLecture, zoomLink: e.target.value })} />
      </div>
      <div className="col-12">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Notes</label>
        <textarea className="form-control form-control-solid" rows={3} placeholder="Add any notes..." value={newLecture.shortNotes} onChange={e => setNewLecture({ ...newLecture, shortNotes: e.target.value })} />
      </div>
      <div className="col-12">
        <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Upload PDF/PPT</label>
        <input type="file" className="form-control form-control-solid" accept=".pdf,.ppt,.pptx"
          onChange={(e) => { if (e.target.files?.[0]) { const f = e.target.files[0]; setNewLecture({ ...newLecture, pptPdfFileName: f.name, pptPdfUrl: URL.createObjectURL(f) }); } }} />
      </div>
      {newLecture.pptPdfFileName && (
        <div className="col-12">
          <div className="d-flex align-items-center gap-3 p-3 rounded-2" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
            <i className="bi bi-file-earmark-pdf text-danger fs-3" />
            <div className="flex-grow-1">
              <span className="fw-semibold text-gray-800 d-block fs-7">{newLecture.pptPdfFileName}</span>
              {newLecture.pptPdfUrl && <a href={newLecture.pptPdfUrl.startsWith("http") || newLecture.pptPdfUrl.startsWith("blob:") ? newLecture.pptPdfUrl : `https://files.fggroup.in/${newLecture.pptPdfUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary fs-8">Preview</a>}
            </div>
            <button type="button" className="btn btn-sm btn-icon" onClick={() => setNewLecture({ ...newLecture, pptPdfFileName: "", pptPdfUrl: "" })}>
              <i className="bi bi-x-lg text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageTitle breadcrumbs={[]}>Lecture Management</PageTitle>

      {/* ━━━ SYLLABUS ━━━ */}
      <div className="bg-white rounded-3 mb-8" style={{ border: '1px solid #f0f0f0' }}>
        <div className="d-flex align-items-center justify-content-between px-6 py-5" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div>
            <h5 className="text-gray-900 fw-bold mb-1 fs-4">Course Syllabus</h5>
            <span className="text-gray-500 fs-7">{courses.length} courses available</span>
          </div>
          <TableButton action="add" onClick={() => setShowAddCourseModal(true)} text="Add Course" />
        </div>
        <div className="px-6 py-5">
          {loadingCourses ? (
            <div className="text-center py-10"><div className="spinner-border spinner-border-sm text-gray-400" /></div>
          ) : courses.length === 0 ? (
            <div className="text-center py-10">
              <i className="bi bi-book text-gray-300" style={{ fontSize: '2.5rem' }} />
              <p className="text-gray-500 mt-3 fs-7 fw-medium">No syllabus found</p>
            </div>
          ) : (
            <div className="row g-3">
              {courses.map((course, i) => (
                <div key={course._id} className="col-md-6 col-lg-4 col-xl-4">
                  <div
                    onClick={() => navigate("/fgiit/courslist", { state: { course } })}
                    className="d-flex align-items-center gap-3 p-3 rounded-3"
                    style={{
                      border: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      background: '#fff',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.background = '#fff'; }}
                  >
                    <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{ width: 38, height: 38, background: '#f5f5f5' }}>
                      <i className={`bi ${getCourseIcon(course.syllabusName)} text-gray-600`} style={{ fontSize: '1rem' }} />
                    </div>
                    <span className="fw-semibold text-gray-800 text-truncate fs-7">{course.syllabusName}</span>
                    <i className="bi bi-chevron-right text-gray-400 ms-auto flex-shrink-0" style={{ fontSize: '0.7rem' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ━━━ BATCHES ━━━ */}
      <div className="bg-white rounded-3 mb-8" style={{ border: '1px solid #f0f0f0' }}>
        <div className="d-flex align-items-center justify-content-between px-6 py-5 flex-wrap gap-3" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div>
            <h5 className="text-gray-900 fw-bold mb-1 fs-4">Batch Management</h5>
            <span className="text-gray-500 fs-7">{availableBatches.filter(b => b.isRunning).length} active batches</span>
          </div>
          <div className="d-flex align-items-center gap-4">
            <TableButton action="add" onClick={() => setShowAddBatchModal(true)} text="Add Batch" />
          </div>
        </div>
        <div className="px-6 py-5">
          {/* Tab switcher */}
          <div className="d-inline-flex rounded-2 mb-5" style={{ background: '#f5f5f5', padding: '3px' }}>
            {(["weekend", "weekday"] as const).map(type => (
              <button key={type} onClick={() => setActiveBatchType(type)}
                className="btn btn-sm fw-semibold px-4 py-2"
                style={{
                  borderRadius: '6px', border: 'none', fontSize: '0.825rem',
                  background: activeBatchType === type ? '#fff' : 'transparent',
                  color: activeBatchType === type ? '#1a1a2e' : '#999',
                  boxShadow: activeBatchType === type ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}>
                {type === "weekend" ? "Weekend" : "Weekday"}
                <span className="ms-2 badge rounded-pill" style={{
                  background: activeBatchType === type ? '#e8e8e8' : 'transparent',
                  color: activeBatchType === type ? '#555' : '#bbb', fontSize: '0.7rem',
                }}>
                  {availableBatches.filter(b => b.batchType === type).length}
                </span>
              </button>
            ))}
          </div>

          {availableBatches.filter(b => b.batchType === activeBatchType).length === 0 ? (
            <div className="text-center py-10">
              <i className="bi bi-inbox text-gray-300" style={{ fontSize: '2.5rem' }} />
              <p className="text-gray-500 mt-3 fs-7 fw-medium">No {activeBatchType} batches</p>
            </div>
          ) : (
            <div className="row g-3">
              {availableBatches.filter(b => b.batchType === activeBatchType).map((batch, idx) => (
                <div className="col-md-4 col-sm-6" key={batch._id}>
                  <div className="d-flex align-items-center gap-3 p-3 rounded-3"
                    style={{
                      border: '1px solid #f0f0f0',
                      background: '#fff',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.background = '#fff'; }}>

                    {/* Number */}
                    <div onClick={() => { setSelectedBatchForModal(batch.batchName); setShowCourseSelectModal(true); }}
                      className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                      style={{
                        width: 38, height: 38, cursor: 'pointer',
                        background: batch.isRunning ? '#10b981' : '#f0f0f0',
                        color: batch.isRunning ? '#fff' : '#888',
                        fontWeight: 700, fontSize: '0.85rem',
                      }}>
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-grow-1 min-w-0" style={{ cursor: 'pointer' }}
                      onClick={() => { setSelectedBatchForModal(batch.batchName); setShowCourseSelectModal(true); }}>
                      <div className="fw-semibold text-gray-800 text-truncate fs-7">{batch.batchName}</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span className="text-gray-400 fs-8">{activeBatchType === "weekend" ? "Weekend" : "Weekday"}</span>
                        {batch.isRunning && <span className="fs-9 fw-bold text-success">● Active</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="d-flex gap-1 flex-shrink-0">
                      <button className="btn btn-sm btn-icon btn-light" style={{ width: 28, height: 28 }}
                        onClick={e => { e.stopPropagation(); handleOpenEditBatch(batch); }}>
                        <i className="bi bi-pencil text-gray-500" style={{ fontSize: '0.7rem' }} />
                      </button>
                      <button className="btn btn-sm btn-icon btn-light" style={{ width: 28, height: 28 }}
                        onClick={e => { e.stopPropagation(); handleDeleteBatch(batch); }}>
                        <i className="bi bi-trash3 text-gray-500" style={{ fontSize: '0.7rem' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ━━━ MENTORS ━━━ */}
      <div className="bg-white rounded-3 mb-8" style={{ border: '1px solid #f0f0f0' }}>
        <div className="d-flex align-items-center justify-content-between px-6 py-5" style={{ borderBottom: '1px solid #f5f5f5' }}>
          <div>
            <h5 className="text-gray-900 fw-bold mb-1 fs-4">Mentors</h5>
            <span className="text-gray-500 fs-7">{mentors.length} registered</span>
          </div>
          <TableButton action="add" onClick={() => setShowAddMentorModal(true)} text="Add Mentor" />
        </div>
        <div className="px-6 py-5">
          <div className="d-flex align-items-center mb-5 flex-wrap gap-3">
            <SearchFilter searchTerm={mentorSearchTerm} setSearchTerm={setMentorSearchTerm} />
            <LengthMenu expenseData={filteredMentors} handleItemsPerPageChange={(v: number) => setMentorPagination({ ...mentorPagination, itemsPerPage: v, page: 1 })} />
          </div>

          <div className="table-responsive">
            <Table data={paginatedMentors} columns={mentorSortableFields} sort={mentorSort} sortOrder={mentorSortOrder}
              onSortChange={(s: string, o: "asc" | "desc") => { setMentorSort(s); setMentorSortOrder(o); }}
              renderRow={(mentor: Mentor, index: number, _: number, isVisible: boolean) => (
                <React.Fragment key={mentor.id}>
                  <tr onClick={() => { if (window.innerWidth <= 1024) setVisibleDetails(visibleDetails === mentor.id ? null : mentor.id); }}
                    className="data-row" style={{ borderBottom: '1px solid #f8f8f8' }}>
                    <td>
                      <span className="text-gray-700 fw-semibold ms-6 fs-7">
                        <FontAwesomeIcon icon={faPlusCircle} className="me-2 plus-icon" style={{ color: '#ddd', fontSize: '14px' }} />
                        {mentorStartIndex + index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-2 overflow-hidden flex-shrink-0"
                          style={{ width: 36, height: 36, background: '#f0f0f0' }}>
                          {mentor.profileImage ? (
                            <img
                              src={mentor.profileImage.startsWith('http') ? mentor.profileImage : `https://files.fggroup.in/${mentor.profileImage}`}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span className="fw-bold text-gray-500 fs-7">{mentor.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="fw-semibold text-gray-800 fs-7">{mentor.name}</span>
                      </div>
                    </td>
                    <td><span className="text-gray-600 fs-7">{mentor.email}</span></td>
                    <td><span className="text-gray-600 fs-7">{mentor.phone}</span></td>
                    <td>
                      <div className="d-flex gap-1">
                        <TableButton action="view" onClick={() => { setSelectedMentor(mentor); setShowViewMentorModal(true); }} />
                        <TableButton action="remove" onClick={() => handleDeleteMentor(mentor.id)} />
                      </div>
                    </td>
                  </tr>
                  {isVisible && (
                    <tr className={`detail-row ${isVisible ? "is-visible" : ""}`}>
                      <td colSpan={5}>
                        <div className="p-4" style={{ background: '#fafafa' }}>
                          <div className="row g-3">
                            <div className="col-4"><small className="text-gray-400 d-block fs-8">Name</small><span className="fw-semibold text-gray-800 fs-7">{mentor.name}</span></div>
                            <div className="col-4"><small className="text-gray-400 d-block fs-8">Email</small><span className="fw-semibold text-gray-800 fs-7">{mentor.email}</span></div>
                            <div className="col-4"><small className="text-gray-400 d-block fs-8">Phone</small><span className="fw-semibold text-gray-800 fs-7">{mentor.phone}</span></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )}
              visibleDetails={visibleDetails} pagination={mentorPagination} setPagination={setMentorPagination} loading={loading}
            />
          </div>

          {filteredMentors.length === 0 && !loading && (
            <div className="text-center py-10">
              <i className="bi bi-person text-gray-300" style={{ fontSize: '2.5rem' }} />
              <p className="text-gray-500 mt-3 fs-7 fw-medium">No mentors found</p>
            </div>
          )}
          {filteredMentors.length > 0 && (
            <UsersListPagination totalPages={mentorTotalPages} currentPage={mentorPagination.page}
              onPageChange={(p: number) => setMentorPagination({ ...mentorPagination, page: p })} />
          )}
        </div>
      </div>

      {/* ━━━━━━━━ MODALS ━━━━━━━━ */}

      {/* Course Select */}
      <Modal show={showCourseSelectModal} onHide={() => setShowCourseSelectModal(false)} centered size="xl" contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h4 className="fw-bold text-gray-900 mb-1">Select Course</h4>
              {selectedBatchForModal && <span className="text-gray-500 fs-7">Batch: <span className="fw-semibold text-gray-700">{selectedBatchForModal}</span></span>}
            </div>
            <button className="btn btn-sm btn-icon btn-light rounded-circle" onClick={() => setShowCourseSelectModal(false)}>
              <i className="bi bi-x-lg text-gray-500" />
            </button>
          </div>
        </div>
        <Modal.Body className="p-6" style={{ background: '#fafafa' }}>
          {loadingCourses ? (
            <div className="text-center py-10"><div className="spinner-border spinner-border-sm text-gray-400" /></div>
          ) : courses.length === 0 ? (
            <div className="text-center py-10">
              <i className="bi bi-book text-gray-300" style={{ fontSize: '2.5rem' }} />
              <p className="text-gray-500 mt-3 fs-7 fw-medium">No courses found. Add a syllabus first.</p>
            </div>
          ) : (
            <div className="row g-4">
              {courses.map(c => (
                <div className="col-md-6 col-xl-4" key={c._id}>
                  <div onClick={() => {
                    setShowCourseSelectModal(false);
                    navigate(`/fgiit/lecture-batch-detail?batch=${encodeURIComponent(selectedBatchForModal || "")}&course=${encodeURIComponent(c.syllabusName)}`,
                      { state: { batch: availableBatches.find(b => b.batchName === selectedBatchForModal), courseName: c.syllabusName, syllabusId: c._id } });
                  }}
                    className="bg-white rounded-3 p-4 h-100"
                    style={{ border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#d0d0d0'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div className="d-flex align-items-start justify-content-between mb-3">
                      <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 40, height: 40, background: '#f5f5f5' }}>
                        <i className={`bi ${getCourseIcon(c.syllabusName)} text-gray-600`} style={{ fontSize: '1.1rem' }} />
                      </div>
                      <i className="bi bi-arrow-up-right text-gray-300 fs-8" />
                    </div>
                    <h6 className="fw-bold text-gray-800 mb-1 fs-7">{c.syllabusName}</h6>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Add Course */}
      <Modal show={showAddCourseModal} onHide={() => { setShowAddCourseModal(false); setNewCourse({ courseName: "" }); }} centered contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h5 className="fw-bold text-gray-900 mb-0">Add Course</h5>
        </div>
        <Modal.Body className="p-6">
          <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Course Name <span className="text-danger">*</span></label>
          <input type="text" className="form-control form-control-solid" placeholder="Enter course name" value={newCourse.courseName} onChange={e => setNewCourse({ courseName: e.target.value })} autoFocus />
        </Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-light fw-semibold" onClick={() => { setShowAddCourseModal(false); setNewCourse({ courseName: "" }); }}>Cancel</button>
          <button className="btn btn-primary fw-semibold" onClick={handleAddCourse}>Add Course</button>
        </div>
      </Modal>

      {/* Add/Edit Mentor */}
      <Modal show={showAddMentorModal} onHide={() => { setShowAddMentorModal(false); resetMentorForm(); }} size="lg" centered contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h5 className="fw-bold text-gray-900 mb-0">{editingMentorId ? "Edit Mentor" : "Add Mentor"}</h5>
        </div>
        <Modal.Body className="p-6">
          <div className="row g-4">
            <div className="col-12">
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control form-control-solid" placeholder="Mentor name" value={newMentor.name} onChange={e => setNewMentor({ ...newMentor, name: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Email <span className="text-danger">*</span></label>
              <input type="email" className="form-control form-control-solid" placeholder="Email address" value={newMentor.email} onChange={e => setNewMentor({ ...newMentor, email: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Phone <span className="text-danger">*</span></label>
              <input type="text" className="form-control form-control-solid" placeholder="Phone number" value={newMentor.phone} onChange={e => setNewMentor({ ...newMentor, phone: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Department</label>
              <input type="text" className="form-control form-control-solid" placeholder="Department" value={newMentor.department} onChange={e => setNewMentor({ ...newMentor, department: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Specialization</label>
              <input type="text" className="form-control form-control-solid" placeholder="Specialization" value={newMentor.specialization} onChange={e => setNewMentor({ ...newMentor, specialization: e.target.value })} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Profile Image</label>
              <div className="d-flex align-items-center gap-4">
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: 60, height: 60, background: '#f5f5f5', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                  {newMentor.profileImage ? (
                    <img
                      src={typeof newMentor.profileImage === 'string'
                        ? ((newMentor.profileImage as string).startsWith('http') ? (newMentor.profileImage as string) : `https://files.fggroup.in/${newMentor.profileImage}`)
                        : URL.createObjectURL(newMentor.profileImage as File)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span className="fw-bold text-gray-500 fs-4">{newMentor.name ? newMentor.name.charAt(0).toUpperCase() : '?'}</span>
                  )}
                </div>
                <div className="flex-grow-1">
                  <input type="file" className="form-control form-control-solid" accept="image/jpeg,image/jpg,image/png" onChange={handleProfileImageChange} />
                  <div className="text-gray-400 fs-8 mt-1">JPG, PNG · Max 5MB</div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Documents</label>
              <input type="file" className="form-control form-control-solid" multiple onChange={handleOtherDocumentsChange} />
              {newMentor.otherDocuments.length > 0 && (
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {newMentor.otherDocuments.map((d, i) => (
                    <span key={i} className="d-inline-flex align-items-center gap-1 bg-light rounded-2 px-2 py-1 fs-8 text-gray-700">
                      <i className="bi bi-file-earmark" /> {d.name}
                      <i className="bi bi-x text-gray-400 cursor-pointer" style={{ cursor: 'pointer' }} onClick={() => handleRemoveDocument(i)} />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-light fw-semibold" onClick={() => { setShowAddMentorModal(false); resetMentorForm(); }}>Cancel</button>
          <button className="btn btn-primary fw-semibold" onClick={handleAddMentor}>{editingMentorId ? "Update" : "Add Mentor"}</button>
        </div>
      </Modal>

      {/* Add Lecture */}
      <Modal show={showAddLectureModal} onHide={() => { setShowAddLectureModal(false); resetLectureForm(); }} size="lg" centered contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h5 className="fw-bold text-gray-900 mb-0">Add Lecture</h5>
        </div>
        <Modal.Body className="p-6">{renderLectureForm()}</Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-light fw-semibold" onClick={() => { setShowAddLectureModal(false); resetLectureForm(); }}>Cancel</button>
          <button className="btn btn-primary fw-semibold" onClick={handleAddLecture}>Add Lecture</button>
        </div>
      </Modal>

      {/* Edit Lecture */}
      <Modal show={showEditLectureModal} onHide={() => { setShowEditLectureModal(false); setSelectedLecture(null); resetLectureForm(); }} size="lg" centered contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h5 className="fw-bold text-gray-900 mb-0">Edit Lecture</h5>
        </div>
        <Modal.Body className="p-6">{renderLectureForm()}</Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-light fw-semibold" onClick={() => { setShowEditLectureModal(false); setSelectedLecture(null); resetLectureForm(); }}>Cancel</button>
          <button className="btn btn-primary fw-semibold" onClick={handleEditLecture}>Save Changes</button>
        </div>
      </Modal>

      {/* Add Batch */}
      <Modal show={showAddBatchModal} onHide={() => { setShowAddBatchModal(false); setNewBatchName(""); setNewBatchIsRunning(false); setNewBatchType("weekend"); }} centered contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h5 className="fw-bold text-gray-900 mb-0">Add Batch</h5>
        </div>
        <Modal.Body className="p-6">
          <div className="d-flex flex-column gap-4">
            <div>
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Batch Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control form-control-solid" placeholder="e.g. Offline Hybrid Batch 13" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Batch Type</label>
              <select className="form-select form-select-solid" value={newBatchType} onChange={e => setNewBatchType(e.target.value as any)}>
                <option value="weekend">Weekend</option>
                <option value="weekday">Weekday</option>
              </select>
            </div>
            <div>
              <label className="form-label fw-semibold text-gray-800 fs-7 d-block mb-2">Status</label>
              <div className="form-check form-switch form-check-custom form-check-solid">
                <input className="form-check-input h-20px w-35px" type="checkbox" checked={newBatchIsRunning} onChange={e => setNewBatchIsRunning(e.target.checked)} id="newBatchRun" />
                <label className="form-check-label fw-medium fs-7 ms-2" htmlFor="newBatchRun" style={{ color: newBatchIsRunning ? '#10b981' : '#999' }}>
                  {newBatchIsRunning ? "Active" : "Inactive"}
                </label>
              </div>
            </div>
          </div>
        </Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-light fw-semibold" onClick={() => { setShowAddBatchModal(false); setNewBatchName(""); setNewBatchIsRunning(false); setNewBatchType("weekend"); }}>Cancel</button>
          <button className="btn btn-primary fw-semibold" onClick={handleAddBatch}>Add Batch</button>
        </div>
      </Modal>

      {/* Edit Batch */}
      <Modal show={showEditBatchModal} onHide={() => { setShowEditBatchModal(false); setEditingBatch(null); }} centered contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <h5 className="fw-bold text-gray-900 mb-0">Edit Batch</h5>
        </div>
        <Modal.Body className="p-6">
          <div className="d-flex flex-column gap-4">
            <div>
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Batch Name <span className="text-danger">*</span></label>
              <input type="text" className="form-control form-control-solid" value={editBatchName} onChange={e => setEditBatchName(e.target.value)} />
            </div>
            <div>
              <label className="form-label fw-semibold text-gray-800 fs-7 mb-1">Batch Type</label>
              <div className="d-flex align-items-center gap-2 bg-gray-100 rounded-2 px-3 py-2 fs-7 text-gray-600 fw-medium">
                <i className="bi bi-lock fs-8" /> {editingBatch?.batchType === "weekend" ? "Weekend" : "Weekday"}
              </div>
              <div className="text-gray-400 fs-8 mt-1">Cannot be changed</div>
            </div>
            <div>
              <label className="form-label fw-semibold text-gray-800 fs-7 d-block mb-2">Status</label>
              <div className="form-check form-switch form-check-custom form-check-solid">
                <input className="form-check-input h-20px w-35px" type="checkbox" checked={editBatchIsRunning} onChange={e => setEditBatchIsRunning(e.target.checked)} id="editBatchRun" />
                <label className="form-check-label fw-medium fs-7 ms-2" htmlFor="editBatchRun" style={{ color: editBatchIsRunning ? '#10b981' : '#999' }}>
                  {editBatchIsRunning ? "Active" : "Inactive"}
                </label>
              </div>
            </div>
          </div>
        </Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-light fw-semibold" onClick={() => { setShowEditBatchModal(false); setEditingBatch(null); }}>Cancel</button>
          <button className="btn btn-primary fw-semibold" onClick={handleUpdateBatch}>Save</button>
        </div>
      </Modal>

      {/* View Mentor */}
      <Modal show={showViewMentorModal} onHide={() => { setShowViewMentorModal(false); setSelectedMentor(null); }} centered contentClassName="border-0 rounded-4 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="fw-bold text-gray-900 mb-0">Mentor Profile</h5>
            <button className="btn btn-sm btn-icon btn-light rounded-circle" onClick={() => { setShowViewMentorModal(false); setSelectedMentor(null); }}>
              <i className="bi bi-x-lg text-gray-500" />
            </button>
          </div>
        </div>
        <Modal.Body className="p-6">
          {selectedMentor && (
            <div>
              {/* Avatar */}
              <div className="text-center mb-5">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle overflow-hidden mb-3"
                  style={{ width: 200, height: 200, background: '#f0f0f0' }}>
                  {selectedMentor.profileImage ? (
                    <img
                      src={selectedMentor.profileImage.startsWith('http') ? selectedMentor.profileImage : `http://files.fggroup.in/${selectedMentor.profileImage}`}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span className="fw-bold text-gray-500" style={{ fontSize: '1.75rem' }}>{selectedMentor.name.charAt(0)}</span>
                  )}
                </div>
                <h5 className="fw-bold text-gray-900 mb-1">{selectedMentor.name}</h5>
                {selectedMentor.specialization && (
                  <span className="bg-light rounded-2 px-3 py-1 fs-8 text-gray-600 fw-medium">{selectedMentor.specialization}</span>
                )}
              </div>

              {/* Details */}
              <div className="d-flex flex-column gap-3">
                {[
                  { icon: "bi-envelope", label: "Email", value: selectedMentor.email },
                  { icon: "bi-telephone", label: "Phone", value: selectedMentor.phone },
                  ...(selectedMentor.department ? [{ icon: "bi-building", label: "Department", value: selectedMentor.department }] : []),
                ].map((item, i) => (
                  <div key={i} className="d-flex align-items-center gap-3 p-3 rounded-2" style={{ background: '#fafafa' }}>
                    <div className="d-flex align-items-center justify-content-center rounded-2" style={{ width: 32, height: 32, background: '#f0f0f0' }}>
                      <i className={`bi ${item.icon} text-gray-500`} style={{ fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <small className="text-gray-400 d-block fs-9">{item.label}</small>
                      <span className="fw-semibold text-gray-800 fs-7">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button className="btn btn-light fw-semibold" onClick={() => { setShowViewMentorModal(false); setSelectedMentor(null); }}>Close</button>
          <button className="btn btn-primary fw-semibold" onClick={() => { setShowViewMentorModal(false); if (selectedMentor) handleEditMentor(selectedMentor); }}>Edit</button>
        </div>
      </Modal>
    </>
  );
};

export default LectureOverview;