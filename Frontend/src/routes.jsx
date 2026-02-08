import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";

const router = createBrowserRouter([
    {path: "/", element: <Welcome />},
    {path: "/login", element: <Login />}
])

export default router;