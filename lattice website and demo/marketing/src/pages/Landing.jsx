import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WelcomeOverlay from '../components/WelcomeOverlay.jsx';

export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const choice = sessionStorage.getItem('lattice-audience');
      if (choice === '/home' || choice === '/enterprise') {
        navigate(choice, { replace: true });
      }
    } catch (e) {}
  }, [navigate]);

  // If a choice exists, the effect navigates; otherwise show overlay.
  let choice = null;
  try { choice = sessionStorage.getItem('lattice-audience'); } catch (e) {}
  if (choice === '/home' || choice === '/enterprise') return null;

  return <WelcomeOverlay />;
}