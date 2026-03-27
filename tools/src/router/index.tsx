import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AboutPage from '../pages/AboutPage'
import ContactPage from '../pages/ContactPage'
import Dashboard from '../pages/Dashboard'
import PrivacyPolicyPage from '../pages/PrivacyPolicyPage'
import TermsOfServicePage from '../pages/TermsOfServicePage'
import ToolPage from '../pages/ToolPage'
import { allTools } from '../utils/toolCatalog'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="terms" element={<TermsOfServicePage />} />
          {allTools.map((tool) => (
            <Route key={tool.id} path={tool.path.replace(/^\//, '')} element={<ToolPage tool={tool} />} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

