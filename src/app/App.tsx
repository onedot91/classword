import { useCallback, useEffect, useState } from 'react';
import { SelectNumberPage } from '../pages/SelectNumberPage';
import { StudentPage } from '../pages/StudentPage';
import { TeacherPage } from '../pages/TeacherPage';
import type { StudentNumber, UserNumber } from '../types/app';
import { STORAGE_KEYS } from './routes';

function readStoredNumber(): UserNumber | null {
  const rawValue = localStorage.getItem(STORAGE_KEYS.userNumber);
  if (!rawValue) {
    return null;
  }

  const numberValue = Number(rawValue);
  if (numberValue >= 0 && numberValue <= 23 && Number.isInteger(numberValue)) {
    return numberValue as UserNumber;
  }

  localStorage.removeItem(STORAGE_KEYS.userNumber);
  return null;
}

export function App() {
  const [userNumber, setUserNumber] = useState<UserNumber | null>(null);

  useEffect(() => {
    setUserNumber(readStoredNumber());
  }, []);

  const handleSelectNumber = useCallback((number: UserNumber) => {
    localStorage.setItem(STORAGE_KEYS.userNumber, String(number));
    setUserNumber(number);
  }, []);

  const handleChangeNumber = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.userNumber);
    setUserNumber(null);
  }, []);

  if (userNumber === null) {
    return <SelectNumberPage onSelectNumber={handleSelectNumber} />;
  }

  if (userNumber === 0) {
    return <TeacherPage onChangeNumber={handleChangeNumber} />;
  }

  return <StudentPage studentNumber={userNumber as StudentNumber} onChangeNumber={handleChangeNumber} />;
}
