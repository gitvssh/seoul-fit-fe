import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WarningModal({ isOpen, onClose }: WarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-[70] flex items-center justify-center'>
      <div className='fixed inset-0 bg-black bg-opacity-50' onClick={onClose} />
      <div className='relative bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-2'>
            <AlertTriangle className='w-5 h-5 text-orange-500' />
            <h3 className='text-lg font-semibold text-gray-900'>선택 필수</h3>
          </div>
          <button onClick={onClose} className='p-1 hover:bg-gray-100 rounded'>
            <X className='w-4 h-4 text-gray-500' />
          </button>
        </div>
        <p className='text-gray-600 mb-4'>최소 1개 이상의 관심사를 선택해주세요.</p>
        <button
          onClick={onClose}
          className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors'
        >
          확인
        </button>
      </div>
    </div>
  );
}
