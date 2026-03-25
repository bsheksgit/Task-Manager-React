import { createBrowserRouter } from "react-router-dom";
import Welcome from "./pages/Welcome";
import UserTasks from "./pages/UserTasks";
import { loader as userTasksLoader } from "./pages/UserTasksLoader";
import RequireAuth from "./components/RequireAuth";
import { apiHelper } from "./services/axiosHelper";

const router = createBrowserRouter([
    { path: "/", 
    element: <Welcome />},
        {
            path: "/users/:userId/tasks",
            element: <RequireAuth><UserTasks/></RequireAuth>,
            loader: userTasksLoader,
        }
]);

export default router;