import { Box } from "@chakra-ui/react"
import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Dashboard from "./pages/Dashboard"
import Groups from "./pages/Groups"
import GroupDetail from "./pages/GroupDetail"
import Votings from "./pages/Votings"
import VotingDetail from "./pages/VotingDetail"
import CastVote from "./pages/CastVote"
import { AuthProvider } from "./context/AuthContext"

function App() {
  return (
    <AuthProvider>
      <Box minH="100vh" bg="gray.50">
        <Navbar />
        <Box as="main" p={4} maxW="1200px" mx="auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:uuid" element={<GroupDetail />} />
            <Route path="/votings" element={<Votings />} />
            <Route path="/votings/:uuid" element={<VotingDetail />} />
            <Route path="/votings/:uuid/vote" element={<CastVote />} />
          </Routes>
        </Box>
      </Box>
    </AuthProvider>
  )
}

export default App

