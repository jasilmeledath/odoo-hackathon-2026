// Toast context: any screen calls useToast() to show a success, error or info message.
import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);
