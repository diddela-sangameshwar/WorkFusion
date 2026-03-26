import { useState, useEffect, useCallback } from 'react';

/**
 * Generic data-fetching hook with loading/error state management.
 * @param {Function} apiFn - The API function that returns an Axios promise.
 * @param {*} params - Optional params to pass to the API function.
 * @param {boolean} immediate - If true, fetches on mount automatically.
 */
const useFetch = (apiFn, params = null, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (overrideParams) => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFn(overrideParams ?? params);
        setData(res.data.data);
        return res.data.data;
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFn, params]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []);

  return { data, loading, error, refetch: execute };
};

export default useFetch;
