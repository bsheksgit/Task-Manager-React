import { apiHelper } from '../services/axiosHelper';

export async function loader({ params }) {
    const userId = params?.userId;
    if (!userId) return { userId: null, tasks: [], error: 'Missing userId' };
    try {
        const data = await apiHelper.getUserTasks(userId);
        return { userId, tasks: data.tasks || [] };
    } catch (e) {
        return { userId, tasks: [], error: e?.message || 'Error fetching tasks' };
    }
}
