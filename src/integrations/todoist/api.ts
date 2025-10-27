const TODOIST_API_URL = "https://api.todoist.com/rest/v2/tasks";

type TodoistEnvKey = 'VITE_TODOIST_API_TOKEN' | 'VITE_TODOIST_PROJECT_ID';

interface CreateFeedbackTaskParams {
  name: string;
  email: string;
  feedback: string;
}

function getEnvVar(key: TodoistEnvKey, fallbackError: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(fallbackError);
  }
  return value;
}

export async function createTodoistFeedbackTask({ name, email, feedback }: CreateFeedbackTaskParams) {
  if (!name.trim() || !email.trim() || !feedback.trim()) {
    throw new Error('Los campos de nombre, email y feedback son obligatorios.');
  }

  const token = getEnvVar('VITE_TODOIST_API_TOKEN', 'Todoist API token no configurado.');
  const projectId = getEnvVar('VITE_TODOIST_PROJECT_ID', 'Todoist project ID no configurado.');

  const taskContent = `${name}+${email}`;

  const response = await fetch(TODOIST_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Request-Id': crypto.randomUUID(),
    },
    body: JSON.stringify({
      project_id: projectId,
      content: taskContent,
      description: feedback,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'No se pudo crear la tarea en Todoist.');
  }

  return response.json();
}
