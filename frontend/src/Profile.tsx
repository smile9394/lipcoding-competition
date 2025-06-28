import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { userApi } from './api';
import Navigation from './Navigation';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState(user?.skills?.join(', ') || '');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('JPG 또는 PNG 형식의 이미지만 업로드 가능합니다.');
      return;
    }

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      setError('이미지 크기는 1MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      setImage(base64);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const skillsArray = user.role === 'mentor' 
        ? skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : undefined;

      const updatedUser = await userApi.updateProfile({
        id: user.id,
        name,
        role: user.role,
        bio,
        image,
        skills: skillsArray
      });

      updateUser(updatedUser);
      setEditing(false);
      setImage('');
    } catch (err: any) {
      setError(err.response?.data?.detail || '프로필 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user.name || '');
    setBio(user.bio || '');
    setSkills(user.skills?.join(', ') || '');
    setImage('');
    setEditing(false);
    setError('');
  };

  return (
    <>
      <Navigation />
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '2rem' }}>내 프로필</h2>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '2rem'
        }}>
          <img
            id="profile-photo"
            src={userApi.getProfileImage(user.role, user.id)}
            alt="프로필 이미지"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #e0e0e0'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://placehold.co/500x500.jpg?text=${user.role.toUpperCase()}`;
            }}
          />
          
          <div>
            <h3>{user.name || '이름 없음'}</h3>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
              {user.role === 'mentor' ? '멘토' : '멘티'} | {user.email}
            </p>
            {user.role === 'mentor' && user.skills && (
              <div>
                <strong>기술 스택:</strong> {user.skills.join(', ')}
              </div>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>
                이름
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="bio" style={{ display: 'block', marginBottom: '0.5rem' }}>
                소개
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {user.role === 'mentor' && (
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="skillsets" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  기술 스택 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  id="skillsets"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, Python"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="profile" style={{ display: 'block', marginBottom: '0.5rem' }}>
                프로필 이미지
              </label>
              <input
                type="file"
                id="profile"
                ref={fileInputRef}
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              <small style={{ color: '#666', display: 'block', marginTop: '0.25rem' }}>
                JPG/PNG, 500x500~1000x1000px, 최대 1MB
              </small>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                id="save"
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h4>소개</h4>
              <p style={{ color: '#666', lineHeight: '1.5' }}>
                {user.bio || '소개가 없습니다.'}
              </p>
            </div>

            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              프로필 수정
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;
