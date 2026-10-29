import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

export interface UseAsyncDataResult<T> {
  data: T | null;
  loading: boolean;
  error: unknown;
  execute: () => Promise<T | null>;
  setData: Dispatch<SetStateAction<T | null>>;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loader();
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void execute();
  }, [execute]);

  return { data, loading, error, execute, setData };
}
