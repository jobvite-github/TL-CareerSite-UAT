export type TaskType = 'Change Request' | 'Issue' | 'Bug' | 'Feature';

export type ColumnId = 'todo' | 'inprogress' | 'done';

export interface Task {
	id: number;
	description: string;
	type: TaskType;
	feedback: string;
	section: string;
	createdAt: string;
	updatedAt: string;
}

export interface Column {
	id: ColumnId;
	title: string;
	items: Task[];
}

export interface BoardData {
	columns: Column[];
	version: string;
}

export interface ModalData {
	description: string;
	type: TaskType;
	feedback: string;
	section: string;
}

export interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}
