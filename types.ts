
export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ReceiptData {
  storeName: string;
  transactionDate: string;
  totalAmount: number;
  items: ReceiptItem[];
}

export enum AppState {
  IDLE,
  CAMERA_REQUEST,
  SCANNING,
  PREVIEW,
  ANALYZING,
  RESULT,
  ERROR,
}
