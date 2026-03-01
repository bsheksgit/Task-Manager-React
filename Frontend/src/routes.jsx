import { createBrowserRouter } from "react-router-dom";
import Welcome from "./pages/Welcome";
import UserTasks from "./pages/UserTasks";
import RequireAuth from "./components/RequireAuth";

const router = createBrowserRouter([
    { path: "/", 
    element: <Welcome />},
    { path: "/user-tasks", 
    element: <RequireAuth><UserTasks/></RequireAuth> 
    }
]);

export default router;