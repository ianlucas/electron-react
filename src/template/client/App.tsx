import { useEffect } from 'react';
import { getInitialState } from '../internal/api';

export default function App() {
  useEffect(() => {
    getInitialState().then((result) => {
      console.log(result);
    });
  }, []);

  return <h1>Hello World!</h1>;
}
