import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CurationProvider } from '@/context/CurationProvider'
import { TweetLibraryProvider } from '@/context/TweetLibraryProvider'
import { AppShell } from '@/components/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { FeedExplorerPage } from '@/pages/FeedExplorerPage'
import { UploadPage } from '@/pages/UploadPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <CurationProvider>
        <TweetLibraryProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="explorer" element={<FeedExplorerPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </TweetLibraryProvider>
      </CurationProvider>
    </BrowserRouter>
  )
}
