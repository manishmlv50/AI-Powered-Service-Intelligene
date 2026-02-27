import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'

// Advisor pages
import AdvisorDashboard from './pages/advisor/Dashboard'
import NewIntake from './pages/advisor/NewIntake'
import JobCards from './pages/advisor/JobCards'
import JobCardDetail from './pages/advisor/JobCardDetail'
import EstimatesPage from './pages/advisor/Estimates'

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerJobCards from './pages/manager/JobCards'
import ReportsPage from './pages/manager/Reports'

// Customer pages
import CustomerChat from './pages/customer/Chat'
import CustomerJobCards from './pages/customer/JobCards'
import CustomerJobCardDetail from './pages/customer/JobCardDetail'
import ServiceHistory from './pages/customer/ServiceHistory'
import MyVehicles from './pages/customer/MyVehicles'

const PAGE_TITLES = {
    '/advisor': 'Dashboard',
    '/advisor/intake': 'New Intake',
    '/advisor/jobs': 'Job Cards',
    '/advisor/estimates': 'Estimates',
    '/advisor/tracking': 'Tracking',
    '/advisor/reports': 'Reports',
    '/advisor/settings': 'Settings',
    '/manager': 'Manager Dashboard',
    '/manager/jobs': 'Job Cards',
    '/manager/reports': 'Reports',
    '/customer/chat': 'AI Service Assistant',
    '/customer/jobs': 'My Job Cards',
    '/customer/jobs/:id': 'Job Card Details',
    '/customer/history': 'Service History',
    '/customer/vehicles': 'My Vehicles',
}

function PortalLayout({ role, children }) {
    const path = window.location.pathname
    const title = PAGE_TITLES[path] || 'Service Intelligence'
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <TopBar title={title} />
                <main style={{ flex: 1, overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    )
}

function RequireAuth({ role, children }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    if (role && user.role !== role) {
        const routes = { advisor: '/advisor', manager: '/manager', customer: '/customer/chat' }
        return <Navigate to={routes[user.role] || '/login'} replace />
    }
    return children
}

function AppRoutes() {
    const { user } = useAuth()
    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to={user.role === 'manager' ? '/manager' : user.role === 'customer' ? '/customer/chat' : '/advisor'} /> : <LoginPage />} />

            {/* Advisor */}
            <Route path="/advisor" element={<RequireAuth role="advisor"><PortalLayout role="advisor"><AdvisorDashboard /></PortalLayout></RequireAuth>} />
            <Route path="/advisor/intake" element={<RequireAuth role="advisor"><PortalLayout role="advisor"><NewIntake /></PortalLayout></RequireAuth>} />
            <Route path="/advisor/jobs" element={<RequireAuth role="advisor"><PortalLayout role="advisor"><JobCards /></PortalLayout></RequireAuth>} />
            <Route path="/advisor/jobs/:id" element={<RequireAuth role="advisor"><PortalLayout role="advisor"><JobCardDetail /></PortalLayout></RequireAuth>} />
            <Route path="/advisor/estimates" element={<RequireAuth role="advisor"><PortalLayout role="advisor"><EstimatesPage /></PortalLayout></RequireAuth>} />
            <Route path="/advisor/tracking" element={<RequireAuth role="advisor"><PortalLayout role="advisor"><ManagerDashboard /></PortalLayout></RequireAuth>} />
           
            {/* Manager */}
            <Route path="/manager" element={<RequireAuth role="manager"><PortalLayout role="manager"><ManagerDashboard /></PortalLayout></RequireAuth>} />
            <Route path="/manager/jobs" element={<RequireAuth role="manager"><PortalLayout role="manager"><ManagerJobCards /></PortalLayout></RequireAuth>} />
            <Route path="/manager/tracking" element={<RequireAuth role="manager"><PortalLayout role="manager"><ManagerDashboard /></PortalLayout></RequireAuth>} />
           
            {/* Customer (no sidebar-style — inline layout in component) */}
            <Route path="/customer/chat" element={<RequireAuth role="customer"><PortalLayout role="customer"><CustomerChat /></PortalLayout></RequireAuth>} />
            <Route path="/customer/jobs" element={<RequireAuth role="customer"><PortalLayout role="customer"><CustomerJobCards /></PortalLayout></RequireAuth>} />
            <Route path="/customer/jobs/:id" element={<RequireAuth role="customer"><PortalLayout role="customer"><CustomerJobCardDetail /></PortalLayout></RequireAuth>} />
            <Route path="/customer/history" element={<RequireAuth role="customer"><PortalLayout role="customer"><ServiceHistory /></PortalLayout></RequireAuth>} />
            <Route path="/customer/vehicles" element={<RequireAuth role="customer"><PortalLayout role="customer"><MyVehicles /></PortalLayout></RequireAuth>} />

            <Route path="*" element={<Navigate to={user ? (user.role === 'manager' ? '/manager' : user.role === 'customer' ? '/customer/chat' : '/advisor') : '/login'} />} />
        </Routes>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    )
}
