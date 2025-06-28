import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '1rem',
      marginBottom: '2rem'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
          멘토-멘티 매칭
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/profile" style={{
            color: 'white',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }}>
            프로필
          </Link>
          
          {user.role === 'mentee' && (
            <Link to="/mentors" style={{
              color: 'white',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}>
              멘토 목록
            </Link>
          )}
          
          <Link to="/requests" style={{
            color: 'white',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            backgroundColor: 'rgba(255,255,255,0.1)'
          }}>
            요청 목록
          </Link>
          
          <span style={{ color: 'white' }}>
            {user.name} ({user.role})
          </span>
          
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
