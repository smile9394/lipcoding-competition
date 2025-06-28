import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { mentorApi, matchRequestApi, Mentor } from './api';
import Navigation from './Navigation';

const Mentors: React.FC = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_date');
  const [requestingMentorId, setRequestingMentorId] = useState<number | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchMentors();
  }, [sortBy]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const data = await mentorApi.getAll({ sort_by: sortBy });
      setMentors(data);
    } catch (err: any) {
      setError('멘토 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mentor.company && mentor.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (mentor.skills && mentor.skills.some((skill: string) => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleRequestMentoring = (mentorId: number) => {
    if (user?.role !== 'mentee') {
      alert('멘티만 멘토링을 요청할 수 있습니다.');
      return;
    }
    setRequestingMentorId(mentorId);
    setRequestMessage('');
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!requestingMentorId || !requestMessage.trim()) {
      alert('메시지를 입력해주세요.');
      return;
    }

    try {
      await matchRequestApi.create({
        mentor_id: requestingMentorId,
        message: requestMessage
      });
      alert('멘토링 요청이 전송되었습니다.');
      setShowRequestModal(false);
      setRequestMessage('');
      setRequestingMentorId(null);
    } catch (err: any) {
      alert('요청 전송에 실패했습니다.');
    }
  };

  const closeModal = () => {
    setShowRequestModal(false);
    setRequestMessage('');
    setRequestingMentorId(null);
  };

  if (!user) return null;

  return (
    <div>
      <Navigation />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h1 id="mentors-title">멘토 찾기</h1>
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            id="search-input"
            type="text"
            placeholder="멘토 이름, 회사, 기술을 검색하세요..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="created_date">최신순</option>
            <option value="name">이름순</option>
            <option value="experience_years">경력순</option>
          </select>
        </div>

        {loading && <div>로딩 중...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        {filteredMentors.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            검색 결과가 없습니다.
          </div>
        ) : (
          <div id="mentors-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="mentor-card"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  {mentor.profile_image ? (
                    <img
                      src={`data:image/jpeg;base64,${mentor.profile_image}`}
                      alt={mentor.name}
                      className="mentor-avatar"
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginRight: '15px'
                      }}
                    />
                  ) : (
                    <div
                      className="mentor-avatar"
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '15px',
                        fontSize: '24px',
                        color: '#666'
                      }}
                    >
                      {mentor.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="mentor-name" style={{ margin: '0 0 5px 0' }}>{mentor.name}</h3>
                    {mentor.company && (
                      <p className="mentor-company" style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        {mentor.company}
                      </p>
                    )}
                  </div>
                </div>

                {mentor.bio && (
                  <p className="mentor-bio" style={{ 
                    margin: '0 0 15px 0', 
                    color: '#333',
                    lineHeight: '1.5'
                  }}>
                    {mentor.bio}
                  </p>
                )}

                {mentor.skills && mentor.skills.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>기술 스택:</strong>
                    <div className="mentor-skills" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {mentor.skills.map((skill: string, index: number) => (
                        <span
                          key={index}
                          className="skill-tag"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#e9ecef',
                            borderRadius: '12px',
                            fontSize: '12px',
                            color: '#495057'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {mentor.experience_years && (
                  <p className="mentor-experience" style={{ margin: '0 0 15px 0', color: '#666' }}>
                    경력: {mentor.experience_years}년
                  </p>
                )}

                {user.role === 'mentee' && (
                  <button
                    className="request-mentoring-button"
                    onClick={() => handleRequestMentoring(mentor.id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    멘토링 요청
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showRequestModal && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={closeModal}
          >
            <div
              className="modal-content"
              style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '8px',
                maxWidth: '500px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0 }}>멘토링 요청</h2>
              <div style={{ marginBottom: '20px' }}>
                <label htmlFor="request-message" style={{ display: 'block', marginBottom: '5px' }}>
                  요청 메시지:
                </label>
                <textarea
                  id="request-message"
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="멘토에게 전하고 싶은 메시지를 작성해주세요..."
                  style={{
                    width: '100%',
                    height: '120px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  취소
                </button>
                <button
                  id="submit-request-button"
                  onClick={handleSubmitRequest}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  요청 보내기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mentors;
