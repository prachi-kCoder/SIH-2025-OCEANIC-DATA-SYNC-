import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard/Dashboard'
import SidebarLayout from './components/layout/SidebarLayout'
import Footer from './components/layout/Footer'
import Navbar from './components/layout/TopNav'
import Home from './pages/Home'
import DataRecordsPage from './pages/DataRecordsPage'
import TaxonomyPage from './pages/TaxonomyPage'
import OceanicParametersPage from './pages/OceanicParametersPage'
import ObisRecordsPage from './pages/ObisRecordsPage'
import MarineDataPage from './pages/MarineDataPage'
import FisheriesPage from './pages/FisheriesPage'
import CMFRIPdfsPage from './pages/CMFRIPdfsPage'
import Login from './components/Auth/Login.jsx'
import Signup from './components/Auth/Signup.jsx'
import ProtectedRoute from './components/Auth/ProtectedRoute.jsx'
import IndobisDashboard from './components/Ai-Model/IndobisDashboard'
function App() {
  return (
    <div className="app-root">
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Home / Landing Page after login */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <>
                  <Navbar />
                  <Home />
                  <Footer />
                </>
              </ProtectedRoute>
            }
          />

          {/* Dashboard and Nested Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="records" element={<DataRecordsPage />} />
            <Route path="fisheries" element={<FisheriesPage />} />
            <Route path="cmfri-pdfs" element={<CMFRIPdfsPage />} />
            <Route path="taxonomy" element={<TaxonomyPage />} />
            <Route path="oceanic-parameters" element={<OceanicParametersPage />} />
            <Route path="obis-records" element={<ObisRecordsPage />} />
            <Route path="marine-data" element={<MarineDataPage />} />
            <Route path="aquainsight" element={<IndobisDashboard />} />
          </Route>

          {/* Redirect root → login by default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
