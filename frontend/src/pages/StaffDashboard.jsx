import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, CheckCircle, Clock, Search, 
  ArrowRight, UserPlus, RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export default function StaffDashboard({ onRegisterNew, onOpenSearch }) {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [queueData, statsData] = await Promise.all([
        api.getVisitsQueue({
          status_filter: statusFilter !== 'all' ? statusFilter : undefined
        }),
        api.getStaffStats()
      ]);
      setQueue(queueData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [statusFilter]);

  const handleUpdateStatus = async (visitId, newStatus) => {
    try {
      await api.updateVisitStatus(visitId, { status: newStatus });
      fetchStaffData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '30px 0 60px' }}>
      <div className="wrap">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Triage & Staff Intake Queue</h1>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)' }}>
              Monitor token progression, triage screening alerts, and assist walk-in patients.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline btn-sm" onClick={fetchStaffData}>
              <RefreshCw size={14} /> Refresh Queue
            </button>
            <button className="btn btn-coral btn-sm" onClick={() => onRegisterNew()}>
              <UserPlus size={14} /> Register Walk-In Patient
            </button>
          </div>
        </div>

        {/* Real Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--teal-700)' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>{stats.in_kiosk}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Currently In Kiosk</div>
            </div>
            <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--red-text)' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--red-text)' }}>{stats.red_flag_alerts}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Red-Flag Screening Flags</div>
            </div>
            <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--amber-text)' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--amber-text)' }}>{stats.awaiting_doctor_review}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Awaiting Doctor Review</div>
            </div>
            <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--green-text)' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--green-text)' }}>{stats.completed_today}</div>
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>Completed Consultations</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          {['all', 'in_kiosk', 'awaiting_review', 'with_doctor', 'completed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {st === 'all' ? 'All Intakes' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Queue Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--ink-soft)', fontSize: '12.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 18px' }}>Token</th>
                <th style={{ padding: '14px 18px' }}>Patient</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Screening Flag</th>
                <th style={{ padding: '14px 18px' }}>Chief Complaint</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Update Stage</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '17px', color: 'var(--teal-900)' }}>
                    {item.token}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{item.patient_name}</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>{item.patient_uid} • {item.phone}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span className="badge badge-teal" style={{ textTransform: 'capitalize' }}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {item.is_red_flag ? (
                      <span className="badge badge-red">🚩 RED FLAG (Priority)</span>
                    ) : (
                      <span className="badge badge-green">Routine</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: '13.5px', maxWidth: '240px' }}>
                    {item.chief_complaint}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    {item.status === 'awaiting_review' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateStatus(item.id, 'with_doctor')}
                      >
                        Call to Doctor
                      </button>
                    )}
                    {item.status === 'with_doctor' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleUpdateStatus(item.id, 'completed')}
                      >
                        Mark Completed
                      </button>
                    )}
                    {item.status === 'completed' && (
                      <span style={{ fontSize: '13px', color: 'var(--green-text)', fontWeight: 600 }}>✓ Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
