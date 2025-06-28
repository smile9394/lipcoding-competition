import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { matchRequestApi, MatchRequest, MatchRequestOutgoing } from './api';
import Navigation from './Navigation';

const Requests: React.FC = () => {
  const { user } = useAuth();
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MatchRequestOutgoing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      if (user && user.role === 'mentor') {
        const data = await matchRequestApi.getIncoming();
        setIncomingRequests(data);
      } else if (user && user.role === 'mentee') {
        const data = await matchRequestApi.getOutgoing();
        setOutgoingRequests(data);
      }
    } catch (err: any) {
      setError('요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  const handleAccept = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await matchRequestApi.accept(requestId);
      await fetchRequests();
      alert('매칭 요청을 수락했습니다.');
    } catch (err: any) {
      alert('요청 수락에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setActionLoading(requestId);
    try {
      await matchRequestApi.reject(requestId);
      await fetchRequests();
      alert('매칭 요청을 거절했습니다.');
    } catch (err: any) {
      alert('요청 거절에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    if (!window.confirm('요청을 취소하시겠습니까?')) {
      return;
    }

    setActionLoading(requestId);
    try {
      await matchRequestApi.cancel(requestId);
      await fetchRequests();
      alert('요청이 취소되었습니다.');
    } catch (err: any) {
      alert('요청 취소에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  return (
    <div>
      <Navigation />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {user.role === 'mentor' ? (
          <div>
            <h1 id="incoming-requests-title">받은 멘토링 요청</h1>
            
            {loading && <div>로딩 중...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            
            {incomingRequests.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                받은 요청이 없습니다.
              </div>
            ) : (
              <div id="incoming-requests-list">
                {incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="request-card"
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '15px',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h3 className="mentee-name" style={{ margin: '0 0 5px 0' }}>
                          멘티 #{request.menteeId}
                        </h3>
                      </div>
                      <div>
                        <span
                          className={`status-${request.status}`}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: 
                              request.status === 'pending' ? '#fff3cd' :
                              request.status === 'accepted' ? '#d4edda' : '#f8d7da',
                            color:
                              request.status === 'pending' ? '#856404' :
                              request.status === 'accepted' ? '#155724' : '#721c24'
                          }}
                        >
                          {request.status === 'pending' ? '대기중' :
                           request.status === 'accepted' ? '수락됨' : '거절됨'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong>요청 메시지:</strong>
                      <p className="request-message" style={{ 
                        marginTop: '5px', 
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {request.message}
                      </p>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          className="accept-button"
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {actionLoading === request.id ? '처리 중...' : '수락'}
                        </button>
                        <button
                          className="reject-button"
                          onClick={() => handleReject(request.id)}
                          disabled={actionLoading === request.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {actionLoading === request.id ? '처리 중...' : '거절'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1 id="outgoing-requests-title">보낸 멘토링 요청</h1>
            
            {loading && <div>로딩 중...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            
            {outgoingRequests.length === 0 && !loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                보낸 요청이 없습니다.
              </div>
            ) : (
              <div id="outgoing-requests-list">
                {outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="request-card"
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      marginBottom: '15px',
                      backgroundColor: 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h3 className="mentor-name" style={{ margin: '0 0 5px 0' }}>
                          멘토 #{request.mentorId}
                        </h3>
                      </div>
                      <div>
                        <span
                          className={`status-${request.status}`}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: 
                              request.status === 'pending' ? '#fff3cd' :
                              request.status === 'accepted' ? '#d4edda' : '#f8d7da',
                            color:
                              request.status === 'pending' ? '#856404' :
                              request.status === 'accepted' ? '#155724' : '#721c24'
                          }}
                        >
                          {request.status === 'pending' ? '대기중' :
                           request.status === 'accepted' ? '수락됨' : '거절됨'}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                      <strong>요청 메시지:</strong>
                      <p className="request-message" style={{ 
                        marginTop: '5px', 
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {request.message}
                      </p>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div>
                        <button
                          className="cancel-button"
                          onClick={() => handleCancel(request.id)}
                          disabled={actionLoading === request.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          {actionLoading === request.id ? '처리 중...' : '요청 취소'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
