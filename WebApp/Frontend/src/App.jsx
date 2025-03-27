import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/auth-context";
import { ProtectedRoute } from "./components/protected-route";
import { DashBoard } from "./app/dashboard/DashBoard";
import { SigninPage } from "./app/Signin/page";
import { SignupPage } from "./app/Signup/page";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<SigninPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashBoard />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </Router>
  );
}

export default App;
