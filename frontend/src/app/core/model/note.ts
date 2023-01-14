export interface Note {
  _id?: string;
  type: string; // should always by 'note'
  template: string; // either 'note' or 'checklist' for the moment
  userId?: String;
  title: string;
  reference?: string;
  content: string;
  color: string;
  tags: string[];
  checklistItems?: ChecklistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChecklistItem {
  text: string;
  checked: boolean;
}
