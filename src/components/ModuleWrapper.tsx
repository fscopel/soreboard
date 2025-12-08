import { ReactNode } from 'react';

interface ModuleWrapperProps {
  title?: string;
  children: ReactNode;
}

export const ModuleWrapper = ({ title, children }: ModuleWrapperProps) => {
  return (
    <div className="h-full flex flex-col">
      {title && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
          {title}
        </div>
      )}
      <div className="flex-1 p-4 overflow-auto">
        {children}
      </div>
    </div>
  );
};

