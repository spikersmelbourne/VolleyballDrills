import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import AddDrill from "./pages/AddDrill";
import EditDrill from "./pages/EditDrill";
import DrillDetails from "./pages/DrillDetails";
import CoachManual from "./pages/CoachManual";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoute";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },

  // público
  { path: "/drills/:id", element: <DrillDetails /> },
  { path: "/coach-manual", element: <CoachManual /> },

  // protegido
  { path: "/add-drill", element: <ProtectedRoute><AddDrill /></ProtectedRoute> },
  { path: "/drills/:id/edit", element: <ProtectedRoute><EditDrill /></ProtectedRoute> },
]);

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: "#18181b", color: "#fafafa" } }}
      />
    </>
  );
}