
import React from 'react';

export const AlertTitle: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <h5 className="mb-1 font-medium leading-none tracking-tight">{children}</h5>
  );
};
