"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types/models";
import {
  TaskState,
  TasksState,
  TaskOperations,
  TasksOperations,
} from "@/types/taskManager";
import { createSupabaseClient } from "@/lib/supabaseClient";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

interface UseTaskManagerReturn
  extends TaskState,
    TasksState,
    TaskOperations,
    TasksOperations {}

export function useTaskManager(taskId?: string): UseTaskManagerReturn {
  const supabase = createSupabaseClient();

  const [task, setTask] = useState<Task | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const fetchTask = async () => {
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("task_id", taskId)
          .single();

        if (error) throw error;

        setTask(data);
        setDate(data.due_date ? new Date(data.due_date) : undefined);
        setError(null);
      } catch (err: any) {
        console.error(`Error fetching task ID ${taskId}:`, err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [taskId, supabase]);

  useEffect(() => {
    if (taskId) return;
    fetchTasks();
  }, [taskId]);

  const updateTask = (updates: Partial<Task>) => {
    setTask((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const saveTask = async (taskToSave?: Task) => {
    try {
      const taskData = taskToSave || task;
      if (!taskData) throw new Error("No task data to save");

      const { error } = await supabase
        .from("tasks")
        .update({
          ...taskData,
          due_date: date ? date.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("task_id", taskData.task_id);

      if (error) throw error;

      setError(null);
    } catch (err: any) {
      console.error("Error saving task:", err);
      setError(err.message);
      throw err;
    }
  };

  const uploadImage = async (file: File) => {
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File size must be less than 1MB");
      }

      if (!task) {
        throw new Error("No task found");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${task.user_id}/${task.task_id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-attachments")
        .upload(fileName, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const updatedTask = { ...task, image_url: fileName };
      setTask(updatedTask);
      await saveTask(updatedTask);
      setError(null);
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError(err.message);
      throw err;
    }
  };

  const removeImage = async () => {
    try {
      if (!task?.image_url) throw new Error("No image to remove");

      const { error: storageError } = await supabase.storage
        .from("task-attachments")
        .remove([task.image_url]);

      if (storageError) throw storageError;

      const updatedTask = { ...task, image_url: null };
      setTask(updatedTask);
      await saveTask(updatedTask);
      setError(null);
    } catch (err: any) {
      console.error("Error removing image:", err);
      setError(err.message);
      throw err;
    }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTasks(data || []);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (title: string, description: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-task-with-ai",
        {
          body: { title, description },
        }
      );

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to call edge function");
      }

      setError(null);
      return data as Task;
    } catch (err: any) {
      console.error("Error creating task:", err);
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskIdToDelete: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("task_id", taskIdToDelete);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.task_id !== taskIdToDelete));
      setError(null);
    } catch (err: any) {
      console.error("Error deleting task:", err);
      setError(err.message);
      throw err;
    }
  };

  const toggleTaskComplete = async (
    taskIdToToggle: string,
    completed: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("task_id", taskIdToToggle);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) =>
          t.task_id === taskIdToToggle ? { ...t, completed } : t
        )
      );
      setError(null);
    } catch (err: any) {
      console.error("Error updating task:", err);
      setError(err.message);
      throw err;
    }
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  return {
    task,
    tasks,
    date,
    error,
    isLoading,
    setDate,
    updateTask,
    saveTask,
    uploadImage,
    removeImage,
    createTask,
    deleteTask,
    toggleTaskComplete,
    refreshTasks,
  };
}