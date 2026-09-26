import React, { useState, useEffect } from 'react';
import {
  Headphones, Send, Volume2, CheckCircle2, AlertCircle, Clock,
  Check, Trash2, RefreshCw, Inbox, ShieldCheck, User, Mail, MessageSquare
} from 'lucide-react';
import {
  submitSupportRequest,
  fetchSupportRequests,
  updateSupportRequestStatus,
  deleteSupportRequest
} from '../services/api';

export default function HelpSupportView({ user = null, token = null }) {
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'admin'
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSpeakerPlaying, setIsSpeakerPlaying] = useState(false);

  // Admin Inbox State
  const [requestsList, setRequestsList] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (activeTab === 'admin') {
      loadSupportRequests();
    }
  }, [activeTab]);

  const loadSupportRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await fetchSupportRequests();
      setRequestsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load support requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!message || !message.trim()) {
      setErrorMsg('Please enter a description of the issue you are facing.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    const userName = user?.name || 'Guest User';
    const userEmail = user?.email || 'guest@aivoiceindia.in';
    const userId = user?.id || null;

    try {
      const res = await submitSupportRequest({
        message: message.trim(),
        userName,
        userEmail,
        userId
      });

      if (res && res.status === 'success') {
        setSuccessMsg("Your support request has been sent successfully.");
        setMessage('');
        // Play subtle speaker audio feedback
        playSpeakerFeedback();
      } else {
        throw new Error(res?.message || 'Submission failed.');
      }
    } catch (err) {
      console.error('Support submission error:', err);
      setErrorMsg(err.message || 'Something went wrong while submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const playSpeakerFeedback = () => {
    setIsSpeakerPlaying(true);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 chime
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5 chime
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
    setTimeout(() => setIsSpeakerPlaying(false), 800);
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      setRequestsList(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
      await updateSupportRequestStatus(requestId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      setRequestsList(prev => prev.filter(r => r.id !== requestId));
      await deleteSupportRequest(requestId);
    } catch (err) {
      console.error('Failed to delete support request:', err);
    }
  };

  const filteredRequests = requestsList.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status?.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* ═══════════════════════════════════════════════════════
          HEADER & SUB-TAB TOGGLE
          ═══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'rgba(37, 99, 235, 0.15)', border: '1px solid #2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Headphones size={18} color="#2563EB" />
            </div>
            <h1 style={{
              fontSize: '1.9rem',
              fontWeight: 800,
              color: '#F0F6FC',
              letterSpacing: '-0.02em',
              margin: 0,
              fontFamily: 'Outfit, var(--font-sans)'
            }}>
              Help & Support
            </h1>
          </div>
          <p style={{ color: '#8B949E', fontSize: '0.92rem', margin: 0 }}>
            {activeTab === 'submit' ? "Tell us about the problem you're facing." : "Manage and respond to user support tickets."}
          </p>
        </div>

        {/* View Switcher: Submit Request / Admin Support Inbox */}
        <div style={{
          display: 'flex',
          background: '#161B22',
          border: '1px solid #30363D',
          borderRadius: '10px',
          padding: '3px'
        }}>
          <button
            onClick={() => setActiveTab('submit')}
            style={{
              background: activeTab === 'submit' ? '#21262d' : 'transparent',
              border: activeTab === 'submit' ? '1px solid #30363D' : '1px solid transparent',
              color: activeTab === 'submit' ? '#F0F6FC' : '#8B949E',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease'
            }}
          >
            <MessageSquare size={14} color={activeTab === 'submit' ? '#2563EB' : 'currentColor'} />
            <span>Submit Issue</span>
          </button>
          
          <button
            onClick={() => setActiveTab('admin')}
            style={{
              background: activeTab === 'admin' ? '#21262d' : 'transparent',
              border: activeTab === 'admin' ? '1px solid #30363D' : '1px solid transparent',
              color: activeTab === 'admin' ? '#F0F6FC' : '#8B949E',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 150ms ease'
            }}
          >
            <Inbox size={14} color={activeTab === 'admin' ? '#2563EB' : 'currentColor'} />
            <span>Admin Support Inbox</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          TAB 1: USER SUPPORT DASHBOARD CARD
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'submit' && (
        <div style={{
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto'
        }}>
          
          {/* Centered Support Card */}
          <div style={{
            background: '#161B22',
            border: '1px solid #30363D',
            borderRadius: '16px',
            padding: '28px 30px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
            boxSizing: 'border-box'
          }}>

            {/* Card Header */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#F0F6FC',
                margin: '0 0 6px 0',
                letterSpacing: '-0.01em'
              }}>
                Help & Support
              </h2>
              <p style={{
                fontSize: '0.9rem',
                color: '#8B949E',
                margin: 0
              }}>
                Tell us about the problem you're facing.
              </p>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div style={{
                background: 'rgba(46, 160, 67, 0.12)',
                border: '1px solid rgba(46, 160, 67, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#3FB950',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle2 size={18} color="#3FB950" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div style={{
                background: 'rgba(248, 113, 113, 0.12)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#F87171',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle size={18} color="#F87171" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Large Rounded Textarea Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              marginBottom: '20px'
            }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue here..."
                style={{
                  width: '100%',
                  height: '180px',
                  minHeight: '180px',
                  background: '#0D1117',
                  border: '1px solid #30363D',
                  borderRadius: '14px',
                  padding: '16px 18px 54px',
                  color: '#F0F6FC',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: '1.5',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                onBlur={(e) => e.target.style.borderColor = '#30363D'}
              />

              {/* Actions at the bottom-right of the textarea */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 2
              }}>
                {/* Speaker Icon (Dashboard icon color #8B949E, not white) */}
                <button
                  type="button"
                  onClick={playSpeakerFeedback}
                  title="Audio notification preview"
                  aria-label="Speaker Audio Feedback"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    color: isSpeakerPlaying ? '#2563EB' : '#8B949E',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#C9D1D9'}
                  onMouseLeave={(e) => e.currentTarget.style.color = isSpeakerPlaying ? '#2563EB' : '#8B949E'}
                >
                  <Volume2 size={20} color="currentColor" />
                </button>

                {/* Send Button with Blue Accent */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSubmitting || !message.trim()}
                  style={{
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 22px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: isSubmitting || !message.trim() ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || !message.trim() ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 3px 12px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.15s ease',
                    fontFamily: 'var(--font-sans)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting && message.trim()) {
                      e.currentTarget.style.background = '#1D4ED8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting && message.trim()) {
                      e.currentTarget.style.background = '#2563EB';
                    }
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" color="#FFFFFF" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} color="#FFFFFF" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Footer user info notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#8B949E',
              paddingTop: '6px'
            }}>
              <span>Logged in as: <strong style={{ color: '#C9D1D9' }}>{user?.email || 'Guest User'}</strong></span>
              <span>Response time: ~2 hours</span>
            </div>

          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          TAB 2: ADMIN SUPPORT INBOX PAGE
          ═══════════════════════════════════════════════════════ */}
      {activeTab === 'admin' && (
        <div>
          
          {/* Admin Control Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['all', 'New', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  style={{
                    background: filterStatus === st ? '#2563EB' : '#161B22',
                    border: filterStatus === st ? '1px solid #2563EB' : '1px solid #30363D',
                    color: filterStatus === st ? '#FFFFFF' : '#8B949E',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st === 'all' ? 'All Requests' : st}
                </button>
              ))}
            </div>

            <button
              onClick={loadSupportRequests}
              style={{
                background: '#161B22',
                border: '1px solid #30363D',
                color: '#F0F6FC',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={14} className={isLoadingRequests ? 'spin-animation' : ''} color="#8B949E" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Requests List */}
          {isLoadingRequests ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8B949E' }}>
              <RefreshCw size={24} className="spin-animation" style={{ marginBottom: '10px' }} />
              <p>Loading support requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{
              background: '#161B22',
              border: '1px solid #30363D',
              borderRadius: '16px',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#8B949E'
            }}>
              <Inbox size={36} color="#30363D" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.05rem', color: '#F0F6FC', marginBottom: '4px' }}>No Support Requests Found</h3>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>There are no support tickets matching your current filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredRequests.map((req) => {
                const statusBg =
                  req.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' :
                  req.status === 'In Progress' ? 'rgba(245, 158, 11, 0.15)' :
                  'rgba(59, 130, 246, 0.15)';
                
                const statusColor =
                  req.status === 'Resolved' ? '#10B981' :
                  req.status === 'In Progress' ? '#F59E0B' :
                  '#3B82F6';

                return (
                  <div
                    key={req.id}
                    style={{
                      background: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {/* Header line: User name + Email + Date & Time + Status badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '50%',
                          background: '#21262d', border: '1px solid #30363D',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <User size={18} color="#2563EB" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#F0F6FC', fontSize: '0.95rem' }}>
                            {req.user_name || 'Guest User'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#8B949E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} color="#8B949E" />
                              {req.user_email || 'No email provided'}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} color="#8B949E" />
                              {req.date_str} {req.time_str}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '999px',
                        background: statusBg,
                        color: statusColor,
                        border: `1px solid ${statusColor}40`
                      }}>
                        {req.status || 'New'}
                      </span>
                    </div>

                    {/* Message body */}
                    <div style={{
                      background: '#0D1117',
                      border: '1px solid #30363D',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      color: '#F0F6FC',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {req.message}
                    </div>

                    {/* Action buttons */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      justifyContent: 'flex-end',
                      flexWrap: 'wrap'
                    }}>
                      {req.status !== 'In Progress' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'In Progress')}
                          style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            color: '#F59E0B',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Mark as In Progress
                        </button>
                      )}

                      {req.status !== 'Resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'Resolved')}
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#10B981',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Mark as Resolved
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(req.id)}
                        style={{
                          background: 'rgba(248, 113, 113, 0.1)',
                          border: '1px solid rgba(248, 113, 113, 0.3)',
                          color: '#F87171',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} color="#F87171" />
                        <span>Delete</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
