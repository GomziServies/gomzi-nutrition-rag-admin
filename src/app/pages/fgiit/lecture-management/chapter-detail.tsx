import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '../../../../_metronic/layout/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faExternalLinkAlt, faVideo } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment';
import { FGIITSyllabusChapter, getFGIITSyllabusChapterById } from '../../../Functions/FGGroup/FGIITSyllabusChapter';

const ChapterDetail: React.FC = () => {
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<FGIITSyllabusChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Read ?id= from URL
  const searchParams = new URLSearchParams(window.location.search);
  const chapterId = searchParams.get('id');

  useEffect(() => {
    if (!chapterId) {
      setError('No chapter ID provided');
      setLoading(false);
      return;
    }
    fetchChapter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const fetchChapter = async () => {
    setLoading(true);
    try {
      const res = await getFGIITSyllabusChapterById(chapterId!);
      if (res?.data) {
        setChapter(res.data);
      } else {
        setError('Chapter not found');
      }
    } catch {
      setError('Failed to load chapter details');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const syllabusName = typeof chapter?.syllabusId === 'object'
    ? (chapter.syllabusId as any).syllabusName
    : 'Syllabus';

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <span className="spinner-border text-primary" style={{ width: '2.5rem', height: '2.5rem' }} />
          <p className="text-muted mt-3 fw-semibold">Loading chapter details...</p>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '3rem' }} />
        <h5 className="mt-3 text-gray-700 fw-bold">{error || 'Chapter not found'}</h5>
        <button className="btn btn-sm btn-light-primary mt-3" onClick={() => window.close()}>
          Close Tab
        </button>
      </div>
    );
  }

  return (
    <>
      <PageTitle breadcrumbs={[]}>{chapter.chapterName}</PageTitle>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* ── Title Banner ── */}
        <div
          className="rounded-4 mb-6 p-6"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
            color: '#fff',
          }}
        >
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span
                  className="badge"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '0.75rem',
                  }}
                >
                  Class {chapter.classNumber}
                </span>
                <span
                  className="badge"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {chapter.batchType || 'Weekend'}
                </span>
              </div>
              <h2 className="mb-1 fw-bold" style={{ color: '#fff', fontSize: '1.5rem' }}>
                {chapter.chapterName}
              </h2>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                {syllabusName}
              </span>
            </div>
          </div>

        {/* ── PDF / PPT ── */}
        {chapter.pdfUrl && (
          <div className="bg-white rounded-3 p-6 mb-6" style={{ border: '1px solid #f0f0f0' }}>
            <h6 className="fw-bold text-gray-800 mb-4 fs-5">
              <FontAwesomeIcon icon={faFilePdf} className="text-danger me-2" />
              Study Material
            </h6>
            <div className="d-flex align-items-center gap-4 flex-wrap">
              <a
                href={chapter.pdfUrl.startsWith("http") ? chapter.pdfUrl : `https://files.fggroup.in/${chapter.pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light-danger fw-semibold d-flex align-items-center gap-2"
              >
                <FontAwesomeIcon icon={faFilePdf} />
                {chapter.pdfFileName || 'View PDF / PPT'}
                <FontAwesomeIcon icon={faExternalLinkAlt} style={{ fontSize: '0.7rem' }} />
              </a>
              <span className="text-muted fs-7">Click to open in a new tab</span>
            </div>
          </div>
        )}

        {/* ── Meta ── */}
        <div className="bg-white rounded-3 p-5" style={{ border: '1px solid #f0f0f0' }}>
          <div className="row">
            <div className="col-md-6">
              <p className="text-muted fs-8 mb-1">Created</p>
              <p className="fw-semibold text-gray-700 fs-7">
                {moment(chapter.createdAt).format('DD MMM YYYY, hh:mm A')}
              </p>
            </div>
            <div className="col-md-6">
              <p className="text-muted fs-8 mb-1">Last Updated</p>
              <p className="fw-semibold text-gray-700 fs-7">
                {moment(chapter.updatedAt).format('DD MMM YYYY, hh:mm A')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterDetail;
