import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal } from "react-bootstrap";
import { PageTitle } from "../../../../_metronic/layout/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faEdit, faTrash, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

// API Imports
import { FGIITSyllabus } from "../../../Functions/FGGroup/FGIITSyllabus";
import {
  FGIITSyllabusChapter,
  CreateFGIITSyllabusChapterParams,
  UpdateFGIITSyllabusChapterParams,
  createFGIITSyllabusChapter,
  getFGIITSyllabusChapters,
  updateFGIITSyllabusChapter,
  removeFGIITSyllabusChapter,
} from "../../../Functions/FGGroup/FGIITSyllabusChapter";
import { FileUploadToFGGroup } from "../../../Functions/FGGroup/AccountFunctions";

// ─── Empty Form ────────────────────────────────────────────────────────────────

const emptyForm = {
  classNumber: "",
  chapterName: "",
  pdfUrl: "",
  pdfFileName: "",
  batchType: "weekend" as "weekend" | "weekday",
};

// ─── Component ─────────────────────────────────────────────────────────────────

const Courslist: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSyllabus: FGIITSyllabus | undefined = (location.state as any)?.course;

  // ── State ────────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [chapters, setChapters] = useState<FGIITSyllabusChapter[]>([]);
  const [activeTab, setActiveTab] = useState<"weekend" | "weekday">("weekend");

  // File upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<FGIITSyllabusChapter | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const editPdfRef = useRef<HTMLInputElement>(null);

  // ── Redirect guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedSyllabus) {
      toast.error("No syllabus selected");
      navigate("/admin/fgiit/lecture-management");
    }
  }, [selectedSyllabus, navigate]);

  // ── Fetch data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedSyllabus?._id) fetchChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSyllabus?._id]);

  const fetchChapters = async () => {
    if (!selectedSyllabus?._id) return;
    setLoading(true);
    try {
      const res = await getFGIITSyllabusChapters({
        syllabusId: selectedSyllabus._id,
        limit: 500,
      });
      setChapters(Array.isArray(res?.data) ? res.data : []);
    } catch { toast.error("Failed to load chapters"); }
    finally { setLoading(false); }
  };


  // ── Filtered chapters by tab ──────────────────────────────────────────────────
  const filtered = chapters
    .filter((c) => (c.batchType || "weekend") === activeTab)
    .sort((a, b) => a.classNumber - b.classNumber);

  // ── PDF Upload helper ─────────────────────────────────────────────────────────
  const uploadPdf = async (file: File): Promise<string> => {
    const res: any = await FileUploadToFGGroup([file]);
    if (res?.data?.fileURLs?.[0]) return res.data.fileURLs[0];
    throw new Error("Upload failed");
  };

  // ── Add Chapter ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ ...emptyForm, batchType: activeTab });
    setPdfFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!form.classNumber || !form.chapterName) {
      return toast.error("Class number and chapter name are required");
    }
    setLoading(true);
    try {
      let pdfUrl = form.pdfUrl;
      let pdfFileName = form.pdfFileName;

      if (pdfFile) {
        setUploadingPdf(true);
        pdfUrl = await uploadPdf(pdfFile);
        pdfFileName = pdfFile.name;
        setUploadingPdf(false);
      }

      const payload: CreateFGIITSyllabusChapterParams = {
        syllabusId: selectedSyllabus!._id,
        classNumber: Number(form.classNumber),
        chapterName: form.chapterName,
        batchType: activeTab, // Always use activeTab
        pdfUrl: pdfUrl || undefined,
        pdfFileName: pdfFileName || undefined,
      };

      await createFGIITSyllabusChapter(payload);
      toast.success("Chapter added successfully");
      setShowAddModal(false);
      resetForm();
      fetchChapters();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add chapter");
    } finally {
      setLoading(false);
      setUploadingPdf(false);
    }
  };

  // ── Edit Chapter ─────────────────────────────────────────────────────────────
  const openEdit = (ch: FGIITSyllabusChapter) => {
    setEditingChapter(ch);
    setForm({
      classNumber: String(ch.classNumber),
      chapterName: ch.chapterName,
      pdfUrl: ch.pdfUrl || "",
      pdfFileName: ch.pdfFileName || "",
      batchType: (ch.batchType || "weekend") as "weekend" | "weekday",
    });
    setEditPdfFile(null);
    if (editPdfRef.current) editPdfRef.current.value = "";
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingChapter || !form.chapterName) {
      return toast.error("Chapter name is required");
    }
    setLoading(true);
    try {
      let pdfUrl = form.pdfUrl;
      let pdfFileName = form.pdfFileName;

      if (editPdfFile) {
        setUploadingPdf(true);
        pdfUrl = await uploadPdf(editPdfFile);
        pdfFileName = editPdfFile.name;
        setUploadingPdf(false);
      }

      const payload: UpdateFGIITSyllabusChapterParams = {
        id: editingChapter._id,
        classNumber: Number(form.classNumber),
        chapterName: form.chapterName,
        batchType: form.batchType, // Keep batchType for edit as it might be different from activeTab if just switched
        pdfUrl: pdfUrl || undefined,
        pdfFileName: pdfFileName || undefined,
      };

      await updateFGIITSyllabusChapter(payload);
      toast.success("Chapter updated successfully");
      setShowEditModal(false);
      setEditingChapter(null);
      fetchChapters();
    } catch {
      toast.error("Failed to update chapter");
    } finally {
      setLoading(false);
      setUploadingPdf(false);
    }
  };

  // ── Delete Chapter ───────────────────────────────────────────────────────────
  const handleDelete = async (ch: FGIITSyllabusChapter) => {
    const r = await Swal.fire({
      title: "Delete Chapter?",
      text: `"${ch.chapterName}" permanently delete thase`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Delete",
    });
    if (!r.isConfirmed) return;
    try {
      await removeFGIITSyllabusChapter(ch._id);
      toast.success("Chapter deleted");
      fetchChapters();
    } catch {
      toast.error("Failed to delete chapter");
    }
  };

  // ── Row click → open detail in new tab ──────────────────────────────────────
  const handleRowClick = (ch: FGIITSyllabusChapter) => {
    window.open(`/fgiit/chapter-detail?id=${ch._id}`, "_blank");
  };


  // ── Modal form shared render ─────────────────────────────────────────────────
  const renderForm = (isEdit: boolean, currentPdfRef: React.RefObject<HTMLInputElement>, onFileChange: (f: File | null) => void, currentFile: File | null) => (
    <div className="row g-4">
      {/* Row 1 */}
      <div className="col-md-3">
        <label className="form-label fw-semibold fs-7 mb-1">Lecture No <span className="text-danger">*</span></label>
        <input
          type="number"
          min={1}
          className="form-control form-control-solid"
          placeholder="1"
          value={form.classNumber}
          onChange={(e) => setForm((p) => ({ ...p, classNumber: e.target.value }))}
        />
      </div>
      <div className="col-md-9">
        <label className="form-label fw-semibold fs-7 mb-1">Chapter Name <span className="text-danger">*</span></label>
        <input
          type="text"
          className="form-control form-control-solid"
          placeholder="Enter chapter name"
          value={form.chapterName}
          onChange={(e) => setForm((p) => ({ ...p, chapterName: e.target.value }))}
        />
      </div>

      {/* PDF/PPT Upload */}
      <div className="col-12">
        <label className="form-label fw-semibold fs-7 mb-1">PDF / PPT</label>
        <input
          type="file"
          ref={currentPdfRef}
          className="form-control form-control-solid"
          accept=".pdf,.ppt,.pptx"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
        {(form.pdfUrl && !currentFile) && (
          <div className="d-flex align-items-center gap-2 mt-2">
            <FontAwesomeIcon icon={faFilePdf} className="text-danger" />
            <a href={form.pdfUrl.startsWith("http") ? form.pdfUrl : `https://files.fggroup.in/${form.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="text-primary fs-7">
              {form.pdfFileName || "View existing PDF"}
            </a>
            <button type="button" className="btn btn-sm btn-icon btn-light" style={{ width: 24, height: 24 }}
              onClick={() => setForm((p) => ({ ...p, pdfUrl: "", pdfFileName: "" }))}>
              <i className="bi bi-x" style={{ fontSize: "0.65rem" }} />
            </button>
          </div>
        )}
        {currentFile && (
          <div className="d-flex align-items-center gap-2 mt-2 text-success fs-7">
            <FontAwesomeIcon icon={faFilePdf} />
            <span>{currentFile.name}</span>
          </div>
        )}
      </div>

    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <PageTitle breadcrumbs={[]}>Lecture Management</PageTitle>

      {/* ── Header ── */}
      <div className="d-flex align-items-center gap-3 mb-6">
        <button className="btn btn-sm btn-light-primary fw-semibold" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1" />
          Back
        </button>
        <div>
          <h4 className="mb-0 fw-bold text-gray-900">
            {selectedSyllabus?.syllabusName || "Course Detail"}
          </h4>
          <span className="text-gray-500 fs-7">Click on a chapter row to view full details</span>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="bg-white rounded-3" style={{ border: "1px solid #f0f0f0" }}>
        {/* Card Header */}
        <div
          className="d-flex align-items-center justify-content-between px-6 py-5 flex-wrap gap-3"
          style={{ borderBottom: "1px solid #f5f5f5" }}
        >
          {/* Weekend / Weekday Tabs */}
          <div className="d-inline-flex rounded-2" style={{ background: "#f5f5f5", padding: "3px" }}>
            {(["weekend", "weekday"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className="btn btn-sm fw-semibold px-4 py-2"
                style={{
                  borderRadius: "6px",
                  border: "none",
                  fontSize: "0.825rem",
                  background: activeTab === type ? "#fff" : "transparent",
                  color: activeTab === type ? "#1a1a2e" : "#999",
                  boxShadow: activeTab === type ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {type === "weekend" ? "Weekend" : "Weekday"}
                <span
                  className="ms-2 badge rounded-pill"
                  style={{
                    background: activeTab === type ? "#e8e8e8" : "transparent",
                    color: activeTab === type ? "#555" : "#bbb",
                    fontSize: "0.7rem",
                  }}
                >
                  {chapters.filter((c) => (c.batchType || "weekend") === type).length}
                </span>
              </button>
            ))}
          </div>

          {/* Add Chapter Button */}
          <button
            className="btn btn-sm btn-primary fw-semibold d-flex align-items-center gap-1"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <FontAwesomeIcon icon={faPlusCircle} />
            Add Chapter
          </button>
        </div>

        {/* Table */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="text-center py-10">
              <span className="spinner-border spinner-border-sm text-primary me-2" />
              <span className="text-muted fw-semibold">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-journal-text text-gray-300" style={{ fontSize: "2.5rem" }} />
              <p className="text-gray-500 mt-3 fs-7 fw-medium">
                No chapters for {activeTab === "weekend" ? "Weekend" : "Weekday"} batch yet.
              </p>
              <button
                className="btn btn-sm btn-primary fw-semibold mt-2"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                Add First Chapter
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle table-row-hover fs-6 gy-4 mb-0">
                <thead>
                  <tr className="fw-bold text-muted bg-light">
                    <th className="ps-4 rounded-start min-w-60px">Lec No.</th>
                    <th className="min-w-250px">Chapter Name</th>
                    <th className="min-w-120px">PDF / PPT</th>
                    <th className="text-center min-w-120px rounded-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ch, idx) => (
                    <tr
                      key={ch._id}
                      style={{ cursor: "pointer", borderBottom: "1px solid #f8f8f8" }}
                      onClick={() => handleRowClick(ch)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {/* No. */}
                      <td className="ps-4">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-2"
                          style={{
                            width: 34,
                            height: 34,
                            background: "#f0f0f0",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "#555",
                          }}
                        >
                          {ch.classNumber}
                        </div>
                      </td>

                      {/* Chapter Name */}
                      <td>
                        <div className="d-flex flex-column">
                          <span className="text-gray-800 fw-semibold fs-6">{ch.chapterName}</span>
                        </div>
                      </td>

                      {/* PDF */}
                      <td onClick={(e) => e.stopPropagation()}>
                        {ch.pdfUrl ? (
                          <a
                            href={ch.pdfUrl.startsWith("http") ? ch.pdfUrl : `https://files.fggroup.in/${ch.pdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="d-flex align-items-center gap-1 text-primary fw-semibold fs-7"
                          >
                            <FontAwesomeIcon icon={faFilePdf} className="text-danger" />
                            View PDF
                          </a>
                        ) : (
                          <span className="text-muted fs-7">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-icon btn-sm btn-light-primary"
                            title="Edit"
                            onClick={() => openEdit(ch)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="btn btn-icon btn-sm btn-light-danger"
                            title="Delete"
                            onClick={() => handleDelete(ch)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ━━━ ADD CHAPTER MODAL ━━━ */}
      <Modal
        show={showAddModal}
        onHide={() => { setShowAddModal(false); resetForm(); }}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 overflow-hidden"
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
          <h5 className="fw-bold text-gray-900 mb-0">Add Chapter</h5>
          <span className="text-gray-500 fs-7">{selectedSyllabus?.syllabusName}</span>
        </div>
        <Modal.Body className="p-6">
          {renderForm(false, pdfInputRef, setPdfFile, pdfFile)}
        </Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #f0f0f0" }}>
          <button
            className="btn btn-light fw-semibold"
            onClick={() => { setShowAddModal(false); resetForm(); }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary fw-semibold"
            onClick={handleAdd}
            disabled={loading || uploadingPdf}
          >
            {uploadingPdf ? (
              <><span className="spinner-border spinner-border-sm me-2" />Uploading...</>
            ) : loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
            ) : (
              <><FontAwesomeIcon icon={faPlusCircle} className="me-2" />Add Chapter</>
            )}
          </button>
        </div>
      </Modal>

      {/* ━━━ EDIT CHAPTER MODAL ━━━ */}
      <Modal
        show={showEditModal}
        onHide={() => { setShowEditModal(false); setEditingChapter(null); }}
        size="lg"
        centered
        contentClassName="border-0 rounded-4 overflow-hidden"
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
          <h5 className="fw-bold text-gray-900 mb-0">Edit Chapter</h5>
        </div>
        <Modal.Body className="p-6">
          {renderForm(true, editPdfRef, setEditPdfFile, editPdfFile)}
        </Modal.Body>
        <div className="d-flex justify-content-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #f0f0f0" }}>
          <button
            className="btn btn-light fw-semibold"
            onClick={() => { setShowEditModal(false); setEditingChapter(null); }}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary fw-semibold"
            onClick={handleUpdate}
            disabled={loading || uploadingPdf}
          >
            {uploadingPdf ? (
              <><span className="spinner-border spinner-border-sm me-2" />Uploading...</>
            ) : loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Courslist;