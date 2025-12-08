import { LayoutProps } from './types';

export const SplitLayout = ({ zones }: LayoutProps) => {
  return (
    <div className="flex h-full bg-gray-100 p-4 gap-4">
      <div className="w-1/4 bg-white rounded-lg shadow-md overflow-hidden">
        {zones['sidebar'] || (
          <div className="flex items-center justify-center h-full text-gray-400">
            Sidebar
          </div>
        )}
      </div>
      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
        {zones['main'] || (
          <div className="flex items-center justify-center h-full text-gray-400">
            Main Content
          </div>
        )}
      </div>
    </div>
  );
};

