import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Engineers from './pages/Engineers';
import Attendance from './pages/Attendance';
import Timesheets from './pages/Timesheets';
import Invoices from './pages/Invoices';
import Contracts from './pages/Contracts';
import Applicants from './pages/Applicants';
import Outreach from './pages/Outreach';
import Admin from './pages/Admin';
import Projects from './pages/Projects';
import Requirements from './pages/Requirements';
import Leads from './pages/Leads';
import SocialTasks from './pages/SocialTasks';
import Salaries from './pages/Salaries';

function Protected({ children }) {
  const { token, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><Dashboard /></Protected>} />
          <Route path="/tickets" element={<Protected><Tickets /></Protected>} />
          <Route path="/tickets/:id" element={<Protected><TicketDetail /></Protected>} />
          <Route path="/engineers" element={<Protected><Engineers /></Protected>} />
          <Route path="/attendance" element={<Protected><Attendance /></Protected>} />
          <Route path="/timesheets" element={<Protected><Timesheets /></Protected>} />
          <Route path="/invoices" element={<Protected><Invoices /></Protected>} />
          <Route path="/contracts" element={<Protected><Contracts /></Protected>} />
          <Route path="/applicants" element={<Protected><Applicants /></Protected>} />
          <Route path="/outreach" element={<Protected><Outreach /></Protected>} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
          <Route path="/projects" element={<Protected><Projects /></Protected>} />
          <Route path="/requirements" element={<Protected><Requirements /></Protected>} />
          <Route path="/leads" element={<Protected><Leads /></Protected>} />
          <Route path="/social-tasks" element={<Protected><SocialTasks /></Protected>} />
          <Route path="/salaries" element={<Protected><Salaries /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
