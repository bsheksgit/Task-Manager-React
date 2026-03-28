import { useEffect, useState } from 'react';
import { useLoaderData, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { commonActions } from '../store/commonSlice';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';

export default function UserTask() {
  const dispatch = useDispatch();
  const loaderData = useLoaderData();
  const { userId, taskId, task, error } = loaderData;
  
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState(task || {});
  const [todoItems, setTodoItems] = useState(task?.todoList || []);
  const [newTodo, setNewTodo] = useState('');
  
  // Update local state when loader data changes
  useEffect(() => {
    if (task) {
      setTaskData(task);
      setTodoItems(task.todoList || []);
    }
  }, [task]);
  
  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Save task:', { ...taskData, todoList: todoItems });
    dispatch(commonActions.openSnackbar({ message: 'Save functionality to be implemented' }));
  };
  
  const handleAddTodo = () => {
    if (newTodo.trim()) {
      setTodoItems([...todoItems, newTodo.trim()]);
      setNewTodo('');
    }
  };
  
  const handleDeleteTodo = (index) => {
    const updatedTodos = todoItems.filter((_, i) => i !== index);
    setTodoItems(updatedTodos);
  };
  
  const handleDeleteTask = () => {
    if (taskId) {
      dispatch(
        commonActions.openDeleteConfirm({
          taskId: taskId,
          title: taskData.title || 'this task',
        })
      );
    }
  };
  
  if (error && !task) {
    return (
      <div className="bg-[#bec1c3] h-full w-full flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4">{error}</div>
          <Link 
            to={`/users/${userId}/tasks`} 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="bg-[#bec1c3] h-full w-full flex items-center justify-center">
        <div className="text-center">Loading task...</div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#bec1c3] h-full w-full flex flex-col items-center overflow-x-hidden overflow-visible">
      {/* Header */}
      <div className="w-full h-16 flex flex-col items-center justify-start mb-6">
        <div className="w-full flex flex-row justify-between items-center">
          <h1 className="text-3xl font-bold text-[#7b5063da] ml-5 pt-4">
            {taskData.title || 'Task Details'}
          </h1>
          <div className="flex gap-4 items-center mr-6 mt-4">
            <Link to="/logout" className="text-red-600 hover:underline">
              Logout
            </Link>
          </div>
        </div>
      </div>
      
      {/* Back button */}
      <div className="w-11/12 mb-6">
        <Link 
          to={`/users/${userId}/tasks`}
          className="text-indigo-600 hover:underline flex items-center gap-2"
        >
          ← Back to Tasks
        </Link>
      </div>
      
      {/* Task Details */}
      <div className="w-11/12 max-w-4xl bg-yellow-300/60 backdrop-blur-sm rounded-lg shadow-md p-6">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#7b5063da] mb-2">Title</h2>
          <div className="text-gray-800 text-lg">{taskData.title}</div>
        </div>
        
        {/* Description */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#7b5063da] mb-2">Description</h2>
          <div className="text-gray-800 text-lg whitespace-pre-wrap">
            {taskData.description}
          </div>
        </div>
        
        {/* Todo List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#7b5063da]">Todo List</h2>
            {todoItems.length === 0 && (
              <button
                onClick={() => setNewTodo('New todo item...')}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800"
              >
                <AddIcon /> Add Todo
              </button>
            )}
          </div>
          
          {todoItems.length > 0 ? (
            <div className="space-y-3">
              {todoItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white/50 rounded p-3">
                  <span className="text-gray-800">{item}</span>
                  <button
                    onClick={() => handleDeleteTodo(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white/30 rounded">
              <p className="text-gray-600 mb-4">No todo items yet</p>
              <button
                onClick={() => setNewTodo('New todo item...')}
                className="flex items-center gap-2 mx-auto text-indigo-600 hover:text-indigo-800"
              >
                <AddIcon /> Add your first todo item
              </button>
            </div>
          )}
          
          {/* Add Todo Input */}
          {newTodo !== '' && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                className="flex-1 p-2 border rounded"
                placeholder="Enter todo item..."
                autoFocus
              />
              <button
                onClick={handleAddTodo}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => setNewTodo('')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {/* Created Date */}
        {taskData.written_at && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#7b5063da] mb-2">Created</h2>
            <div className="text-gray-600">
              {new Date(taskData.written_at).toLocaleDateString()} at{' '}
              {new Date(taskData.written_at).toLocaleTimeString()}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-row justify-end items-center gap-4 pt-6 border-t">
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTask}
          >
            Delete Task
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}