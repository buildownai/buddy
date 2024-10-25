export interface TreeViewItem {
  name: string;
  id?: string | number;
  children?: TreeViewItem[];
  checked?: boolean;
  selected?: boolean;
  expanded?: boolean;
  disabled?: boolean;
  meta: {
    path: string;
    isDirectory: boolean;
  };
}
