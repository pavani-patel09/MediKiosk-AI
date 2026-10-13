import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, Search, Filter, AlertTriangle, CheckCircle, 
  Clock, FileText, ChevronRight, RefreshCw, UserCheck 
} from 'lucide-react';
import { api } from '../services/api';

export default function DoctorDashboard({ onOpenCase, onOpenSearch }) {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [queueData, statsData] = await Promise.all([
        api.getVisitsQueue({
          department: departmentFilter !== 'all' ? departmentFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          status_filter: statusFilter !== 'all' ? statusFilter : undefined
        }),
        api.getDoctorStats()
      ]);
      setQueue(queueData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [departmentFilter, priorityFilter, statusFilter]);

  const filteredQueue = queue.filter(item => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.patient_name.toLowerCase().includes(q) ||
      item.patient_uid.toLowerCase().includes(q) ||
      item.token.toLowerCase().includes(q) ||
      item.phone.includes(q)
    );
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'red_flag':
        return <span className="badge badge-red">🔴 High Priority</span>;
      case 'attention':
        return <span className="badge badge-amber">🟠 Attention</span>;
      case 'monitor':
        return <span className="badge badge-yellow">🟡 Monitor</span>;
      default:
        return <span className="badge badge-green">🟢 Routine</span>;
    }
  };

  return (
    <div style={{ padding: '30px 0 60px' }}>
      <div className="wrap">
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--teal-100)', color: 'var(--teal-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope size={22} />
              </div>
              <h1 style={{ fontSize: '28px', margin: 0 }}>Doctor Clinical Queue</h1>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--ink-soft)', marginTop: '4px' }}>
              Review patient intake histories, OCR findings, and AI draft summaries. Verify records before clinical decisions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline btn-sm" onClick={fetchDashboardData}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button className="btn btn-primary btn-sm" onClick={onOpenSearch}>
              <Search size={14} /> Search Any Patient
            </button>
          </div>
        </div>

        {/* Real Database Statistics Grid */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '14px',
            marginBottom: '28px'
          }}>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--teal-700)' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>{stats.total_patients}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>Total Patients</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--red-text)' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--red-text)' }}>{stats.high_priority}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>High Priority</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--amber-text)' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--amber-text)' }}>{stats.needs_review}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>Needs Review</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--yellow-text)' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--yellow-text)' }}>{stats.monitoring}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>Monitoring</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--green-text)' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--green-text)' }}>{stats.routine}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>Routine</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid var(--coral-600)' }}>
              <div style={{ fontSize: '26px', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--coral-600)' }}>{stats.ai_summaries_ready}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>AI Summaries Ready</div>
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--ink-muted)' }} />
            <input
              type="text"
              className="input-control"
              placeholder="Filter queue by name, token, ID, or phone..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ paddingLeft: '38px', height: '42px', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="input-control"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              style={{ height: '42px', fontSize: '13.5px' }}
            >
              <option value="all">All Departments</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Surgery">Surgery</option>
              <option value="Paediatrics">Paediatrics</option>
              <option value="Ayurveda">Ayurveda</option>
            </select>

            <select
              className="input-control"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ height: '42px', fontSize: '13.5px' }}
            >
              <option value="all">All Priorities</option>
              <option value="red_flag">🔴 High Priority</option>
              <option value="attention">🟠 Attention</option>
              <option value="monitor">🟡 Monitoring</option>
              <option value="routine">🟢 Routine</option>
            </select>
          </div>
        </div>

        {/* Table of Queue Patients */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-main)', borderBottom: '1.5px solid var(--border-subtle)', color: 'var(--ink-soft)', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 18px' }}>Token</th>
                <th style={{ padding: '14px 18px' }}>Patient Details</th>
                <th style={{ padding: '14px 18px' }}>Dept</th>
                <th style={{ padding: '14px 18px' }}>Chief Complaint</th>
                <th style={{ padding: '14px 18px' }}>Priority</th>
                <th style={{ padding: '14px 18px' }}>AI Summary</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-soft)' }}>
                    {loading ? 'Loading queue records...' : 'No visits match the current filters.'}
                  </td>
                </tr>
              ) : (
                filteredQueue.map(item => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--teal-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                    onClick={() => onOpenCase(item)}
                  >
                    <td style={{ padding: '14px 18px', fontWeight: 800, fontSize: '16px', color: 'var(--teal-900)' }}>
                      {item.token}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{item.patient_name}</div>
                      <div style={{ fontSize: '12.5px', color: 'var(--ink-soft)' }}>
                        {item.patient_uid} • {item.age ? `${item.age}y` : 'Age N/A'} • {item.gender} • {item.blood_group || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '14px' }}>
                      {item.department}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: '14px', maxWidth: '240px' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.chief_complaint}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {getPriorityBadge(item.priority)}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {item.is_summary_verified ? (
                        <span className="badge badge-green">✓ Verified by Doctor</span>
                      ) : item.has_ai_summary ? (
                        <span className="badge badge-teal">🤖 Ready for Review</span>
                      ) : (
                        <span className="badge badge-grey">Pending Intake</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => { e.stopPropagation(); onOpenCase(item); }}
                      >
                        Open Case <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
